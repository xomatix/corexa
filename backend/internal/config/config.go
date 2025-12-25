package config

import (
	"database/sql"
	"log"
	"sync"
)

type FieldConfig struct {
	ID           string `json:"id"`
	CollectionID string `json:"collection_id"`
	Name         string `json:"name"`
	Label        string `json:"label"`
	Type         string `json:"type"`
	IsPrimary    bool   `json:"is_primary"`
	IsNotNull    bool   `json:"is_not_null"`
	IsUnique     bool   `json:"is_unique"`
	ForeignTable string `json:"foreign_table"`
	Validation   string `json:"validation"`
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
	rows, err = db.Query("SELECT id, collection_id, name, coalesce(label, ''), type, is_primary, is_nullable, is_unique, coalesce(foreign_table::text, ''), coalesce(validation, '') FROM fields")
	if err != nil {
		return err
	}
	defer rows.Close()

	var fields []FieldConfig
	for rows.Next() {
		var f FieldConfig
		if err := rows.Scan(&f.ID, &f.CollectionID, &f.Name, &f.Label, &f.Type, &f.IsPrimary, &f.IsNotNull, &f.IsUnique, &f.ForeignTable, &f.Validation); err != nil {
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
				ForeignTable: "core_collections",
			},
			"validation": {
				ID:           "validation",
				CollectionID: "core_fields",
				Name:         "validation",
				Label:        "Validation",
				Type:         "string",
				IsPrimary:    false,
				IsNotNull:    false,
				IsUnique:     false,
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
			},
			"label": {
				ID:           "label",
				CollectionID: "core_data_types",
				Name:         "label",
				Label:        "Label",
				Type:         "varchar(255)",
				IsPrimary:    true,
				IsNotNull:    false,
				IsUnique:     false,
			},
		},
	}
	ConfigCache[coreDataTypes.Name] = coreDataTypes
	ConfigCacheByID[coreDataTypes.ID] = coreDataTypes

	loadPermissionsConfig()
	loadAuditLogsConfig()

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

func loadPermissionsConfig() {
	// Roles table
	coreRoles := CollectionConfig{
		ID:    "core_roles",
		Name:  "roles",
		Label: "Roles [CORE]",
		Fields: map[string]FieldConfig{
			"id": {
				ID:           "id",
				CollectionID: "core_roles",
				Name:         "id",
				Label:        "ID",
				Type:         "uuid",
				IsPrimary:    true,
				IsNotNull:    true,
				IsUnique:     true,
			},
			"name": {
				ID:           "name",
				CollectionID: "core_roles",
				Name:         "name",
				Label:        "Name",
				Type:         "varchar(255)",
				IsPrimary:    false,
				IsNotNull:    true,
				IsUnique:     true,
			},
			"description": {
				ID:           "description",
				CollectionID: "core_roles",
				Name:         "description",
				Label:        "Description",
				Type:         "text",
			},
		},
	}
	ConfigCache[coreRoles.Name] = coreRoles
	ConfigCacheByID[coreRoles.ID] = coreRoles

	// User_Roles join table
	coreUserRoles := CollectionConfig{
		ID:    "core_user_roles",
		Name:  "user_roles",
		Label: "User Roles [CORE]",
		Fields: map[string]FieldConfig{
			"user_id": {
				ID:           "user_id",
				CollectionID: "core_user_roles",
				Name:         "user_id",
				Label:        "User ID",
				Type:         "uuid",
				IsNotNull:    true,
				IsPrimary:    true,
				ForeignTable: "core_users",
			},
			"role_id": {
				ID:           "role_id",
				CollectionID: "core_user_roles",
				Name:         "role_id",
				Label:        "Role ID",
				Type:         "uuid",
				IsPrimary:    true,
				IsNotNull:    true,
				ForeignTable: "core_roles",
			},
		},
	}
	ConfigCache[coreUserRoles.Name] = coreUserRoles
	ConfigCacheByID[coreUserRoles.ID] = coreUserRoles

	// Permissions table
	corePermissions := CollectionConfig{
		ID:    "core_permissions",
		Name:  "permissions",
		Label: "Permissions [CORE]",
		Fields: map[string]FieldConfig{
			"id": {
				ID:           "id",
				CollectionID: "core_permissions",
				Name:         "id",
				Label:        "ID",
				Type:         "uuid",
				IsPrimary:    true,
				IsNotNull:    true,
				IsUnique:     true,
			},
			"name": {
				ID:           "name",
				CollectionID: "core_permissions",
				Name:         "name",
				Label:        "Name",
				Type:         "varchar(255)",
				IsNotNull:    true,
				IsUnique:     true,
			},
			"description": {
				ID:           "description",
				CollectionID: "core_permissions",
				Name:         "description",
				Label:        "Description",
				Type:         "text",
				IsNotNull:    false,
			},
		},
	}
	ConfigCache[corePermissions.Name] = corePermissions
	ConfigCacheByID[corePermissions.ID] = corePermissions

	// User_Permissions join table
	coreUserPermissions := CollectionConfig{
		ID:    "core_user_permissions",
		Name:  "user_permissions",
		Label: "User Permissions [CORE]",
		Fields: map[string]FieldConfig{
			"user_id": {
				ID:           "user_id",
				CollectionID: "core_user_permissions",
				Name:         "user_id",
				Label:        "User ID",
				Type:         "uuid",
				IsNotNull:    true,
				IsPrimary:    true,
				ForeignTable: "core_users",
			},
			"permissions_id": {
				ID:           "permissions_id",
				CollectionID: "core_user_permissions",
				Name:         "permissions_id",
				Label:        "Permission ID",
				Type:         "uuid",
				IsPrimary:    true,
				IsNotNull:    true,
				ForeignTable: "core_permissions",
			},
		},
	}
	ConfigCache[coreUserPermissions.Name] = coreUserPermissions
	ConfigCacheByID[coreUserPermissions.ID] = coreUserPermissions

	// Role_Permissions join table
	coreRolePermissions := CollectionConfig{
		ID:    "core_role_permissions",
		Name:  "role_permissions",
		Label: "Role Permissions [CORE]",
		Fields: map[string]FieldConfig{
			"role_id": {
				ID:           "role_id",
				CollectionID: "core_role_permissions",
				Name:         "role_id",
				Label:        "Role ID",
				Type:         "uuid",
				IsNotNull:    true,
				IsPrimary:    true,
				ForeignTable: "core_roles",
			},
			"permissions_id": {
				ID:           "permissions_id",
				CollectionID: "core_role_permissions",
				Name:         "permissions_id",
				Label:        "Permission ID",
				Type:         "uuid",
				IsPrimary:    true,
				IsNotNull:    true,
				ForeignTable: "core_permissions",
			},
		},
	}
	ConfigCache[coreRolePermissions.Name] = coreRolePermissions
	ConfigCacheByID[coreRolePermissions.ID] = coreRolePermissions

	// Collection_Permissions join table
	coreCollectionPermissions := CollectionConfig{
		ID:    "core_collection_permissions",
		Name:  "collection_permissions",
		Label: "Collection Permissions [CORE]",
		Fields: map[string]FieldConfig{
			"collections_id": {
				ID:           "collections_id",
				CollectionID: "core_collection_permissions",
				Name:         "collections_id",
				Label:        "Collection ID",
				Type:         "uuid",
				IsNotNull:    true,
				IsPrimary:    true,
				ForeignTable: "core_collections",
			},
			"permissions_id": {
				ID:           "permissions_id",
				CollectionID: "core_collection_permissions",
				Name:         "permissions_id",
				Label:        "Permission ID",
				Type:         "uuid",
				IsPrimary:    true,
				IsNotNull:    true,
				ForeignTable: "core_permissions",
			},
			"action": {
				ID:           "action",
				CollectionID: "core_collection_permissions",
				Name:         "action",
				Label:        "Action",
				Type:         "varchar(1)", // C, R, U, D
				IsNotNull:    false,
				IsPrimary:    true,
			},
		},
	}
	ConfigCache[coreCollectionPermissions.Name] = coreCollectionPermissions
	ConfigCacheByID[coreCollectionPermissions.ID] = coreCollectionPermissions

	coreUsers := CollectionConfig{
		ID:    "core_users",
		Name:  "users",
		Label: "Users [CORE]",
		Fields: map[string]FieldConfig{
			"id": {
				ID:           "id",
				CollectionID: "core_users",
				Name:         "id",
				Label:        "User ID",
				Type:         "uuid",
				IsPrimary:    true,
				IsNotNull:    true,
			},
			"username": {
				ID:           "username",
				CollectionID: "core_users",
				Name:         "username",
				Label:        "Username",
				Type:         "varchar(255)",
				IsNotNull:    true,
				IsUnique:     true,
			},
			//     password_hash TEXT NOT NULL,
			// "password_hash": {
			// 	ID:           "action",
			// 	CollectionID: "core_users",
			// 	Name:         "action",
			// 	Label:        "Action",
			// 	Type:         "varchar(1)", // C, R, U, D
			// 	IsNotNull:    false,
			// },
			"display_name": {
				ID:           "display_name",
				CollectionID: "core_users",
				Name:         "display_name",
				Label:        "Display name",
				Type:         "text",
			},
			"email": {
				ID:           "email",
				CollectionID: "core_users",
				Name:         "email",
				Label:        "Email",
				Type:         "varchar(320)",
			},
			"is_active": {
				ID:           "is_active",
				CollectionID: "core_users",
				Name:         "is_active",
				Label:        "Is Active",
				Type:         "boolean",
				IsNotNull:    true,
			},
			"is_superuser": {
				ID:           "is_superuser",
				CollectionID: "core_users",
				Name:         "is_superuser",
				Label:        "Is SUPERUSER",
				Type:         "boolean",
				IsNotNull:    true,
			},
		},
	}
	ConfigCache[coreUsers.Name] = coreUsers
	ConfigCacheByID[coreUsers.ID] = coreUsers

}

func loadAuditLogsConfig() {
	// Audit logs table
	coreAuditLogs := CollectionConfig{
		ID:    "core_audit_logs",
		Name:  "audit_logs",
		Label: "Audit logs [CORE]",
		Fields: map[string]FieldConfig{
			"collection_id": {
				ID:           "collection_id",
				CollectionID: "core_audit_logs",
				Name:         "collection_id",
				Label:        "Collection Id",
				Type:         "uuid",
				IsPrimary:    false,
				IsNotNull:    true,
				IsUnique:     false,
				ForeignTable: "core_collections",
			},
			"action": {
				ID:           "action",
				CollectionID: "core_audit_logs",
				Name:         "action",
				Label:        "action",
				Type:         "varchar(1)",
				IsPrimary:    false,
				IsNotNull:    true,
				IsUnique:     false,
			},
			"record_id": {
				ID:           "record_id",
				CollectionID: "core_audit_logs",
				Name:         "record_id",
				Label:        "Record Id",
				Type:         "uuid",
				IsPrimary:    false,
				IsNotNull:    true,
				IsUnique:     false,
			},
			"record": {
				ID:           "record",
				CollectionID: "core_audit_logs",
				Name:         "Record",
				Label:        "record",
				Type:         "jsonb",
				IsPrimary:    false,
				IsNotNull:    true,
				IsUnique:     false,
			},
			"changed_at": {
				ID:           "changed_at",
				CollectionID: "core_audit_logs",
				Name:         "Changed At",
				Label:        "changed_at",
				Type:         "TIMESTAMP",
				IsPrimary:    false,
				IsNotNull:    true,
				IsUnique:     false,
			},
			"changed_user_id": {
				ID:           "changed_user_id",
				CollectionID: "core_audit_logs",
				Name:         "changed_user_id",
				Label:        "Changed User Id",
				Type:         "TIMESTAMP",
				IsPrimary:    false,
				IsNotNull:    true,
				IsUnique:     false,
				ForeignTable: "core_users",
			},
		},
	}
	ConfigCache[coreAuditLogs.Name] = coreAuditLogs
	ConfigCacheByID[coreAuditLogs.ID] = coreAuditLogs
}
