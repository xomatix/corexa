package config

import (
	"database/sql"
	"log"
	"sync"
)

type FieldConfig struct {
	ID           string  `json:"id"`
	CollectionID string  `json:"collection_id"`
	Name         string  `json:"name"`
	Label        string  `json:"label"`
	Type         string  `json:"type"`
	IsPrimary    bool    `json:"is_primary"`
	IsNotNull    bool    `json:"is_not_null"`
	IsUnique     bool    `json:"is_unique"`
	ForeignTable *string `json:"foreign_table"`
}

type CollectionConfig struct {
	ID     string                 `json:"id"`
	Name   string                 `json:"name"`
	Label  string                 `json:"label"`
	Fields map[string]FieldConfig `json:"fields"`
}

var (
	ConfigCache     = make(map[string]CollectionConfig)
	ConfigCacheByID = make(map[string]CollectionConfig)
	configMutex     = &sync.RWMutex{}
)

func LoadConfig(db *sql.DB) error {
	configMutex.Lock()
	defer configMutex.Unlock()

	// Load collections
	rows, err := db.Query("SELECT id, name, coalesce(label, '') FROM collections")
	if err != nil {
		return err
	}
	defer rows.Close()

	var collections []CollectionConfig
	for rows.Next() {
		var c CollectionConfig
		if err := rows.Scan(&c.ID, &c.Name, &c.Label); err != nil {
			return err
		}
		collections = append(collections, c)
	}

	// Load fields
	rows, err = db.Query("SELECT id, collection_id, name, coalesce(label, ''), type, is_primary, is_nullable, is_unique, foreign_table FROM fields")
	if err != nil {
		return err
	}
	defer rows.Close()

	var fields []FieldConfig
	for rows.Next() {
		var f FieldConfig
		if err := rows.Scan(&f.ID, &f.CollectionID, &f.Name, &f.Label, &f.Type, &f.IsPrimary, &f.IsNotNull, &f.IsUnique, &f.ForeignTable); err != nil {
			return err
		}
		fields = append(fields, f)
	}

	// Reset caches
	ConfigCache = make(map[string]CollectionConfig)
	ConfigCacheByID = make(map[string]CollectionConfig)

	// Group fields by collection ID
	fieldMap := make(map[string][]FieldConfig)
	for _, f := range fields {
		fieldMap[f.CollectionID] = append(fieldMap[f.CollectionID], f)
	}

	// Build configs and fill caches
	for _, c := range collections {
		c.Fields = make(map[string]FieldConfig)
		for _, f := range fieldMap[c.ID] {
			c.Fields[f.Name] = f
		}
		ConfigCache[c.Name] = c
		ConfigCacheByID[c.ID] = c
	}

	// Core collections: insert in both caches
	coreCollections := CollectionConfig{
		ID:    "core_collections",
		Name:  "collections",
		Label: "collections [CORE]",
		Fields: map[string]FieldConfig{
			"id": {
				ID:           "id",
				CollectionID: "core_collections",
				Name:         "id",
				Label:        "ID",
				Type:         "uuid",
				IsPrimary:    true,
				IsNotNull:    false,
				IsUnique:     true,
				ForeignTable: nil,
			},
			"name": {
				ID:           "name",
				CollectionID: "core_collections",
				Name:         "name",
				Label:        "Name",
				Type:         "string",
				IsPrimary:    false,
				IsNotNull:    false,
				IsUnique:     true,
				ForeignTable: nil,
			},
			"label": {
				ID:           "label",
				CollectionID: "core_collections",
				Name:         "label",
				Label:        "Label",
				Type:         "string",
				IsPrimary:    false,
				IsNotNull:    false,
				IsUnique:     false,
				ForeignTable: nil,
			},
		},
	}
	ConfigCache[coreCollections.Name] = coreCollections
	ConfigCacheByID[coreCollections.ID] = coreCollections

	coreFields := CollectionConfig{
		ID:    "core_fields",
		Name:  "fields",
		Label: "fields [CORE]",
		Fields: map[string]FieldConfig{
			"id": {
				ID:           "id",
				CollectionID: "core_fields",
				Name:         "id",
				Label:        "ID",
				Type:         "uuid",
				IsPrimary:    true,
				IsNotNull:    false,
				IsUnique:     true,
				ForeignTable: nil,
			},
			"collection_id": {
				ID:           "collection_id",
				CollectionID: "core_fields",
				Name:         "collection_id",
				Label:        "Collection ID",
				Type:         "uuid",
				IsPrimary:    false,
				IsNotNull:    false,
				IsUnique:     false,
				ForeignTable: nil,
			},
			"name": {
				ID:           "name",
				CollectionID: "core_fields",
				Name:         "name",
				Label:        "Name",
				Type:         "string",
				IsPrimary:    false,
				IsNotNull:    false,
				IsUnique:     false,
				ForeignTable: nil,
			},
			"label": {
				ID:           "label",
				CollectionID: "core_fields",
				Name:         "label",
				Label:        "Label",
				Type:         "string",
				IsPrimary:    false,
				IsNotNull:    true,
				IsUnique:     false,
				ForeignTable: nil,
			},
			"type": {
				ID:           "type",
				CollectionID: "core_fields",
				Name:         "type",
				Label:        "Type",
				Type:         "string",
				IsPrimary:    false,
				IsNotNull:    false,
				IsUnique:     false,
				ForeignTable: nil,
			},
			"is_primary": {
				ID:           "is_primary",
				CollectionID: "core_fields",
				Name:         "is_primary",
				Label:        "Is Primary",
				Type:         "bool",
				IsPrimary:    false,
				IsNotNull:    false,
				IsUnique:     false,
				ForeignTable: nil,
			},
			"is_nullable": {
				ID:           "is_nullable",
				CollectionID: "core_fields",
				Name:         "is_nullable",
				Label:        "Is Nullable",
				Type:         "bool",
				IsPrimary:    false,
				IsNotNull:    false,
				IsUnique:     false,
				ForeignTable: nil,
			},
			"is_unique": {
				ID:           "is_unique",
				CollectionID: "core_fields",
				Name:         "is_unique",
				Label:        "Is Unique",
				Type:         "bool",
				IsPrimary:    false,
				IsNotNull:    false,
				IsUnique:     false,
				ForeignTable: nil,
			},
			"foreign_table": {
				ID:           "foreign_table",
				CollectionID: "core_fields",
				Name:         "foreign_table",
				Label:        "Foreign Table",
				Type:         "uuid",
				IsPrimary:    false,
				IsNotNull:    true,
				IsUnique:     false,
				ForeignTable: nil,
			},
		},
	}
	ConfigCache[coreFields.Name] = coreFields
	ConfigCacheByID[coreFields.ID] = coreFields

	coreDataTypes := CollectionConfig{
		ID:    "core_data_types",
		Name:  "data_types",
		Label: "data types [CORE]",
		Fields: map[string]FieldConfig{
			"id": {
				ID:           "id",
				CollectionID: "core_data_types",
				Name:         "id",
				Label:        "ID",
				Type:         "uuid",
				IsPrimary:    true,
				IsNotNull:    false,
				IsUnique:     true,
				ForeignTable: nil,
			},
			"name": {
				ID:           "name",
				CollectionID: "core_data_types",
				Name:         "name",
				Label:        "Name",
				Type:         "varchar(100)",
				IsPrimary:    false,
				IsNotNull:    true,
				IsUnique:     true,
				ForeignTable: nil,
			},
			"label": {
				ID:           "label",
				CollectionID: "core_data_types",
				Name:         "label",
				Label:        "Label",
				Type:         "varchar(255)",
				IsPrimary:    false,
				IsNotNull:    false,
				IsUnique:     false,
				ForeignTable: nil,
			},
		},
	}
	ConfigCache[coreDataTypes.Name] = coreDataTypes
	ConfigCacheByID[coreDataTypes.ID] = coreDataTypes

	log.Printf("Loaded %d collections into cache (by name).", len(ConfigCache))
	return nil
}

func GetCollectionConfig(name string) (CollectionConfig, bool) {
	configMutex.RLock()
	defer configMutex.RUnlock()
	cfg, exists := ConfigCache[name]
	return cfg, exists
}

func GetCollectionConfigByID(id string) (CollectionConfig, bool) {
	configMutex.RLock()
	defer configMutex.RUnlock()
	cfg, exists := ConfigCacheByID[id]
	return cfg, exists
}
