package service

import (
	"corexa/internal/config"
	"corexa/internal/models"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"

	"github.com/lib/pq"
)

func SaveCollection(db *sql.DB, req models.SaveRequest) (interface{}, error) {

	action := req.Action
	data := req.Data

	switch action {
	case models.InsertAction:

		if len(data) == 0 {
			return nil, fmt.Errorf("insert action requires data")
		}

		columns := make([]string, 0, len(data))
		placeholders := make([]string, 0, len(data))
		var args []interface{}

		i := 1
		for col, val := range req.Data {
			columns = append(columns, pq.QuoteIdentifier(col))
			placeholders = append(placeholders, "$"+strconv.Itoa(i))
			args = append(args, val)
			i++
		}

		tx, err := db.Begin()
		if err != nil {
			return nil, err
		}

		if req.Collection == "collections" {
			tableName := data["name"].(string)
			// create new empty table
			ctQuery := fmt.Sprintf("CREATE TABLE %s ();", tableName)
			_, err = tx.Exec(ctQuery)
			if err != nil {
				tx.Rollback()
				return nil, err
			}
		}

		// create new field
		if req.Collection == "fields" {
			acQuery, err := addColumnQuery(db, req, req.Collection)
			fmt.Println(acQuery)
			if err != nil {
				tx.Rollback()
				return nil, err
			}

			_, err = tx.Exec(acQuery)
			if err != nil {
				tx.Rollback()
				return nil, err
			}
		}

		query := fmt.Sprintf(
			"INSERT INTO %s (%s) VALUES (%s) RETURNING id",
			req.Collection,
			strings.Join(columns, ", "),
			strings.Join(placeholders, ", "),
		)
		rows, err := tx.Query(query, args...)
		if err != nil {
			tx.Rollback()
			log.Printf("%s", query)
			return nil, err
		}
		defer rows.Close()
		results, err := ScanRowsToMaps(rows)
		if err != nil {
			tx.Rollback()
			return nil, err
		}

		if len(results) > 0 {
			tx.Commit()
			return results[0], nil
		}
		tx.Rollback()
		return nil, fmt.Errorf("insert did not return a row")

	case models.UpdateAction:

		pkField := "id"
		pkRawValue, ok := req.Data[pkField]
		if !ok {
			return nil, fmt.Errorf("primary key '%s' is required for update", pkField)
		}

		pkValue, ok := pkRawValue.(string)
		if ok == false {
			return nil, fmt.Errorf("Error obtaining \"id\" field")
		}

		var setClauses []string
		var args []interface{}
		i := 1
		for col, val := range req.Data {
			if col == pkField {
				continue
			}
			if col != "label" && col != "validation" {
				continue
			}
			setClauses = append(setClauses, fmt.Sprintf("%s = $%d", pq.QuoteIdentifier(col), i))
			args = append(args, val)
			i++
		}
		if len(setClauses) == 0 {
			return nil, fmt.Errorf("no fields to update")
		}
		args = append(args, pkValue)

		tableName := req.Collection

		query := fmt.Sprintf("UPDATE %s SET %s WHERE %s = $%d RETURNING *",
			pq.QuoteIdentifier(tableName),
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
		results, err := ScanRowsToMaps(rows)
		if err != nil {
			return nil, err
		}
		if len(results) > 0 {
			return results[0], nil
		}
		return nil, fmt.Errorf("update did not return a row or no row was found to update")

	case models.DeleteAction:
		pkField := "id"

		pkRawValue, ok := req.Data[pkField]
		if !ok {
			return nil, fmt.Errorf("primary key '%s' is required for delete", pkField)
		}

		pkValue, ok := pkRawValue.(string)
		if ok == false {
			return nil, fmt.Errorf("Error obtaining \"id\" field")
		}

		tx, err := db.Begin()
		if err != nil {
			tx.Rollback()
			return nil, err
		}

		if req.Collection == "collections" {
			// delete data from fields
			query := fmt.Sprintf("DELETE FROM fields WHERE collection_id = $1")

			log.Printf("Deleting SQL fields: %s with arg: %v", query, []interface{}{pkValue})
			_, err := tx.Exec(query, pkValue)

			if err != nil {
				tx.Rollback()
				return nil, err
			}
			// delete data from collections
			query = fmt.Sprintf("DELETE FROM collections WHERE id = $1")

			log.Printf("Deleting SQL table: %s with arg: %v", query, []interface{}{pkValue})
			_, err = tx.Exec(query, pkValue)

			if err != nil {
				tx.Rollback()
				return nil, err
			}

			tableName, err := getCollectionName(db, pkValue)
			if err != nil {
				tx.Rollback()
				return nil, err
			}

			ctQuery := fmt.Sprintf("DROP TABLE %s;", tableName)
			_, err = tx.Exec(ctQuery)
			if err != nil {
				tx.Rollback()
				return nil, err
			}
		}

		// create new field
		if req.Collection == "fields" {
			// delete data from fields
			query := fmt.Sprintf("DELETE FROM fields WHERE id = $1")

			log.Printf("Deleting SQL fields: %s with arg: %v", query, []interface{}{pkValue})
			_, err := tx.Exec(query, pkValue)

			if err != nil {
				tx.Rollback()
				return nil, err
			}

			acQuery, err := delColumnQuery(db, req)
			if err != nil {
				tx.Rollback()
				return nil, err
			}
			_, err = tx.Exec(acQuery)
			if err != nil {
				tx.Rollback()
				return nil, err
			}
		}
		tx.Commit()

		return map[string]interface{}{"status": "deleted"}, nil

	default:
		return nil, fmt.Errorf("unsupported save action: %s", req.Action)
	}
}

func iif(condition bool, trueVal, falseVal string) string {
	if condition {
		return trueVal
	}
	return falseVal
}

func addColumnQuery(db *sql.DB, req models.SaveRequest, tableName string) (string, error) {
	jsonBytes, err := json.Marshal(req.Data)
	if err != nil {
		return "", fmt.Errorf("error marshaling map to JSON: %w", err)
	}

	var fieldConfig config.FieldConfig
	if err := json.Unmarshal(jsonBytes, &fieldConfig); err != nil {
		return "", fmt.Errorf("error unmarshaling JSON to struct: %w", err)
	}

	collectionName, err := getCollectionName(db, fieldConfig.CollectionID)
	collectionConfig, exists := config.GetCollectionConfig(collectionName)

	if err != nil || !exists {
		return "", fmt.Errorf("Error obtaining collection from given collection_id: %s err: %w", fieldConfig.CollectionID, err)
	}

	createPrimaryKey := true
	for _, v := range collectionConfig.Fields {
		if v.IsPrimary && strings.ToLower(v.Type) == "uuid" {
			createPrimaryKey = false
			break
		}
	}

	if createPrimaryKey && !fieldConfig.IsPrimary {
		return "", fmt.Errorf("the collection must have a primary key field before adding other fields (collection_id: %s, collection_name: %s)", fieldConfig.CollectionID, collectionName)
	}

	query := fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s %s %s %s %s",
		collectionName, fieldConfig.Name, fieldConfig.Type,
		iif(fieldConfig.IsNotNull, "NOT NULL", ""),
		iif(fieldConfig.IsUnique, "UNIQUE", ""),
		iif(fieldConfig.IsPrimary, "PRIMARY KEY DEFAULT gen_random_uuid()", ""),
	)

	row := db.QueryRow(`select c.name as collection_name, f.name as field_name 
	from collections c 
	join fields f on f.collection_id = c.id 
	where c.id = $1 and f.is_primary = true ;`,
		fieldConfig.ForeignTable)

	if fieldConfig.ForeignTable != "" && len(fieldConfig.ForeignTable) > 0 {
		var foreignCollectionName, pkForeignCollectionFieldName string
		if err := row.Scan(&foreignCollectionName, &pkForeignCollectionFieldName); err != nil {
			return "", err
		}

		query += fmt.Sprintf(", ADD CONSTRAINT fk_%s FOREIGN KEY (%s) REFERENCES %s(%s) ON DELETE SET NULL",
			fieldConfig.Name, fieldConfig.Name, foreignCollectionName, pkForeignCollectionFieldName)
	}
	return query, nil
}

func delColumnQuery(db *sql.DB, req models.SaveRequest) (string, error) {
	jsonBytes, err := json.Marshal(req.Data)
	if err != nil {
		return "", fmt.Errorf("error marshaling map to JSON: %w", err)
	}

	var config config.FieldConfig
	if err := json.Unmarshal(jsonBytes, &config); err != nil {
		return "", fmt.Errorf("error unmarshaling JSON to struct: %w", err)
	}

	collectionName, err := getCollectionName(db, config.CollectionID)
	if err != nil {
		return "", err
	}

	fieldName, err := getFieldName(db, config.ID)
	if err != nil {
		return "", err
	}

	query := fmt.Sprintf("ALTER TABLE %s DROP COLUMN IF EXISTS %s;",
		collectionName, fieldName,
	)

	return query, nil
}

func getCollectionName(db *sql.DB, collectionId string) (string, error) {
	row := db.QueryRow(`select c.name as collection_name
	from collections c 
	where c.id = $1;`,
		collectionId)

	var collectionName string
	err := row.Scan(&collectionName)

	if err != nil {
		return "", err
	}
	return collectionName, nil
}

func getFieldName(db *sql.DB, id string) (string, error) {
	row := db.QueryRow(`select f.name as field_name
	from fields f 
	where f.id = $1;`,
		id)

	var fieldName string
	err := row.Scan(&fieldName)

	if err != nil {
		return "", err
	}
	return fieldName, nil
}
