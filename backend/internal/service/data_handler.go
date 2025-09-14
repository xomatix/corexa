package service

import (
	"corexa/internal/config"
	"corexa/internal/models"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"

	"github.com/lib/pq"
)

// #TODO
// scanRowsToMaps is a helper to convert dynamic sql.Rows into a slice of maps.
// This is a replacement for sqlx.MapScan.
func scanRowsToMaps(rows *sql.Rows) ([]map[string]interface{}, error) {
	columns, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("failed to get columns: %w", err)
	}
	colCount := len(columns)
	var results []map[string]interface{}

	for rows.Next() {
		values := make([]interface{}, colCount)
		valuePtrs := make([]interface{}, colCount)
		for i := 0; i < colCount; i++ {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		rowData := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			// JSON handling
			if col == "expand" {
				var decoded interface{}
				if err := json.Unmarshal(val.([]byte), &decoded); err == nil {
					rowData[col] = decoded

				}
			} else if b, ok := val.([]byte); ok {
				rowData[col] = string(b)
			} else {
				rowData[col] = val
			}
		}
		results = append(results, rowData)
	}
	return results, nil
}

func GetCollectionConfigForField(fromTable, foreignFieldName string) (config.CollectionConfig, string, error) {
	cfg, exists := config.GetCollectionConfig(fromTable)
	if !exists {
		return config.CollectionConfig{}, "", fmt.Errorf("No collection config for table %s was found", fromTable)
	}

	for _, v := range cfg.Fields {
		if v.Name != foreignFieldName {
			continue
		}
		foundCfg, exists := config.GetCollectionConfigByID(*v.ForeignTable)
		if !exists {
			return config.CollectionConfig{}, "", fmt.Errorf("No collection config for table %s was found", fromTable)
		}
		pFieldName := ""
		for _, field := range foundCfg.Fields {
			if !field.IsPrimary {
				continue
			}
			pFieldName = field.Name
			break
		}
		return foundCfg, pFieldName, nil
	}
	return config.CollectionConfig{}, "", fmt.Errorf("Relation between %s and %s wasn't found", fromTable, foreignFieldName)
}

// #TODO testing
func buildWhereClause(filter string, joinAliases map[string]string, cfg config.CollectionConfig) (string, []interface{}, error) {

	replacements := []string{}
	const pattern = `(?:\w{1,100}\.{1}){1,6}\w{1,100}`

	re, err := regexp.Compile(pattern)
	if err != nil {
		fmt.Printf("Error compiling regex: %s\n", err)
		return "", nil, nil
	}

	matches := re.FindAllString(filter, -1)

	for _, match := range matches {
		fmt.Println(match)

		parts := strings.Split(match, ".")

		// fieldName := parts[len(parts)-1]

		parts = parts[:len(parts)-1]

		strToReplace := strings.Join(parts, ".")
		aliasToReplaceWith, ok := joinAliases[strToReplace]
		replacements = append(replacements, fmt.Sprintf(strToReplace+" => "+aliasToReplaceWith))

		if !ok {
			return "", nil, fmt.Errorf("Could not find alias replacement for field path: %s", strToReplace)
		}

		filter = strings.Replace(filter, strToReplace+".", aliasToReplaceWith+".", 1)
	}

	fmt.Printf("%v+", replacements)

	if len(filter) == 0 {
		return "", nil, nil
	}

	return "WHERE " + filter, nil, nil
}

func buildJoinClause(expand string, cfg config.CollectionConfig) (string, map[string]string, string, error) {
	if len(expand) == 0 {
		return "", nil, "", nil
	}

	joinClause := ""
	joinAliases := make(map[string]string, 0)
	expandSelect := make([]string, 0)
	expandGroups := strings.Split(expand, ",")

	joinIndex := 1
	for _, expandGroup := range expandGroups {
		expandFields := strings.Split(expandGroup, ".")

		if len(expandFields) == 0 {
			continue
		} else if len(expandFields) == 1 {
			joinTableConfig, pkField, err := GetCollectionConfigForField(cfg.Name, expandGroup)
			if err != nil {
				return "", nil, "", err
			}
			if pkField == "" {
				return "", nil, "", fmt.Errorf("Table %s doesn't have pk", joinTableConfig.Name)
			}

			joinClause +=
				fmt.Sprintf(
					"LEFT JOIN %s s%d ON s.%s = s%d.%s",
					joinTableConfig.Name, joinIndex, expandGroup, joinIndex, pkField)
			expandSelect = append(expandSelect, fmt.Sprintf("'%s', jsonb_agg(s%d.*)::json->0", expandGroup, joinIndex))

			joinAliases[expandGroup] = fmt.Sprintf("s%d", joinIndex)
			joinIndex++
		} else {
			expandPrev := ""
			currentTableName := cfg.Name
			for iter, expandPart := range expandFields {
				alias, ok := joinAliases[expandPrev]
				if !ok {
					alias = "s"
				}
				joinTableConfig, pkField, err := GetCollectionConfigForField(currentTableName, expandPart)
				if err != nil {
					return "", nil, "", err
				}
				if pkField == "" {
					return "", nil, "", fmt.Errorf("Table %s doesn't have pk", joinTableConfig.Name)
				}
				joinClause +=
					fmt.Sprintf(
						"LEFT JOIN %s s%d ON %s.%s = s%d.%s ",
						joinTableConfig.Name, joinIndex, alias, expandPart, joinIndex, pkField)
				if iter > 0 {
					expandPrev = expandPrev + "." + expandPart
				} else {
					expandPrev = expandPart
				}

				expandSelect = append(expandSelect, fmt.Sprintf("'%s', jsonb_agg(s%d.*)::json->0", expandPrev, joinIndex))
				currentTableName = joinTableConfig.Name

				joinAliases[expandPrev] = fmt.Sprintf("s%d", joinIndex)
				joinIndex++
			}
		}
	}

	return joinClause, joinAliases, strings.Join(expandSelect, ", "), nil
}

// #TODO
func HandleSelect(db *sql.DB, req models.SelectRequest, cfg config.CollectionConfig) (models.SelectResponse, error) {
	joinClause, joinAliases, expandSelect, err := buildJoinClause(req.Expand, cfg)

	whereClause, args, err := buildWhereClause(req.Filter, joinAliases, cfg)
	fmt.Printf("\nwhereClause %s", whereClause)

	if err != nil {
		return models.SelectResponse{}, err
	}

	pkField := ""
	for _, f := range cfg.Fields {
		if f.IsPrimary {
			pkField = f.Name
			break
		}
	}

	// #TODO make and test
	// collectionPermission, sessionUser, err := permissions.GetPermission(db, "user123userl23", cfg.ID, "select")

	// if err != nil {
	// 	return models.SelectResponse{}, fmt.Errorf("There was an error with permissions %s", err)
	// }

	countQuery := fmt.Sprintf("SELECT count(s.*) FROM %s s %s %s", pq.QuoteIdentifier(cfg.Name), joinClause, whereClause)
	fmt.Printf("\ncountQuery: %s", countQuery)
	var total uint64
	err = db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return models.SelectResponse{}, fmt.Errorf("failed to count records: %w", err)
	}

	query := fmt.Sprintf("SELECT s.*, json_build_object(%s) as expand FROM %s s %s %s GROUP BY s.%s", expandSelect, pq.QuoteIdentifier(cfg.Name), joinClause, whereClause, pkField)
	argCount := len(args)

	if req.Pagination.Limit > 0 {
		query += " LIMIT $" + strconv.Itoa(argCount+1)
		args = append(args, req.Pagination.Limit)
		argCount++
	}
	query += " OFFSET $" + strconv.Itoa(argCount+1)
	args = append(args, req.Pagination.Offset)

	log.Printf("Executing SQL: %s with args: %v", query, args)

	rows, err := db.Query(query, args...)
	if err != nil {
		return models.SelectResponse{}, fmt.Errorf("failed to execute select query: %w", err)
	}
	defer rows.Close()

	results, err := scanRowsToMaps(rows)
	if err != nil {
		return models.SelectResponse{}, err
	}

	return models.SelectResponse{
		Data: results,
		Pagination: models.PaginationInfo{
			Size:  req.Pagination.Limit,
			Page:  req.Pagination.Offset,
			Total: total,
		},
	}, nil
}

// #TODO
func HandleSave(db *sql.DB, req models.SaveRequest, cfg config.CollectionConfig) (interface{}, error) {
	for key, val := range req.Data {
		fieldCfg, ok := cfg.Fields[key]
		if !ok {
			return nil, fmt.Errorf("field '%s' does not exist in collection '%s'", key, cfg.Name)
		}
		if !fieldCfg.IsNotNull && val == nil {
			return nil, fmt.Errorf("field '%s' cannot be null", key)
		}
	}
	// #TODO
	switch req.Action {
	case "insert":
		var columns []string
		var placeholders []string
		var args []interface{}
		i := 1
		for col, val := range req.Data {
			columns = append(columns, pq.QuoteIdentifier(col))
			placeholders = append(placeholders, "$"+strconv.Itoa(i))
			args = append(args, val)
			i++
		}

		query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s) RETURNING *",
			pq.QuoteIdentifier(cfg.Name),
			strings.Join(columns, ", "),
			strings.Join(placeholders, ", "),
		)
		log.Printf("Executing SQL: %s with args: %v", query, args)
		rows, err := db.Query(query, args...)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		results, err := scanRowsToMaps(rows)
		if err != nil {
			return nil, err
		}
		if len(results) > 0 {
			return results[0], nil
		}
		return nil, fmt.Errorf("insert did not return a row")
		// #TODO
	case "update":
		pkField, ok := findPrimaryKey(cfg)
		if !ok {
			return nil, fmt.Errorf("no primary key defined for collection '%s'", cfg.Name)
		}
		pkValue, ok := req.Data[pkField]
		if !ok {
			return nil, fmt.Errorf("primary key '%s' is required for update", pkField)
		}

		var setClauses []string
		var args []interface{}
		i := 1
		for col, val := range req.Data {
			if col == pkField {
				continue // Don't include PK in the SET clause
			}
			setClauses = append(setClauses, fmt.Sprintf("%s = $%d", pq.QuoteIdentifier(col), i))
			args = append(args, val)
			i++
		}
		if len(setClauses) == 0 {
			return nil, fmt.Errorf("no fields to update")
		}

		args = append(args, pkValue)
		query := fmt.Sprintf("UPDATE %s SET %s WHERE %s = $%d RETURNING *",
			pq.QuoteIdentifier(cfg.Name),
			strings.Join(setClauses, ", "),
			pq.QuoteIdentifier(pkField),
			i,
		)

		log.Printf("Executing SQL: %s with args: %v", query, args)
		rows, err := db.Query(query, args...)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		results, err := scanRowsToMaps(rows)
		if err != nil {
			return nil, err
		}
		if len(results) > 0 {
			return results[0], nil
		}
		return nil, fmt.Errorf("update did not return a row or no row was found to update")

	// #TODO
	case "delete":
		pkField, ok := findPrimaryKey(cfg)
		if !ok {
			return nil, fmt.Errorf("no primary key defined for collection '%s'", cfg.Name)
		}
		pkValue, ok := req.Data[pkField]
		if !ok {
			return nil, fmt.Errorf("primary key '%s' is required for delete", pkField)
		}

		query := fmt.Sprintf("DELETE FROM %s WHERE %s = $1",
			pq.QuoteIdentifier(cfg.Name),
			pq.QuoteIdentifier(pkField),
		)

		log.Printf("Executing SQL: %s with args: %v", query, []interface{}{pkValue})
		result, err := db.Exec(query, pkValue)
		if err != nil {
			return nil, err
		}
		rowsAffected, _ := result.RowsAffected()
		return map[string]interface{}{"status": "deleted", "rows_affected": rowsAffected}, nil

	default:
		return nil, fmt.Errorf("unsupported save action: %s", req.Action)
	}
}

// findPrimaryKey remains the same #TODO
func findPrimaryKey(cfg config.CollectionConfig) (string, bool) {
	for name, field := range cfg.Fields {
		if field.IsPrimary {
			return name, true
		}
	}
	return "", false
}
