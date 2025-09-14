package permissions

import (
	"corexa/internal/models"
	"database/sql"
	"fmt"
)

// #TODO
func GetPermission(db *sql.DB, sessionId string, collection string, action models.SaveAction) (models.CollectionPermission, models.SessionUser, error) {
	obtainUserQuery := `select 
	u.id, u.username, u.display_name, u.email, u.is_superuser
	from sessions s join users u on u.id = s.users_id 
	where (s.expires_at > now() or s.expires_at is null) and s.id = $1 and u.is_active = 1 limit 1;`
	row := db.QueryRow(obtainUserQuery, sessionId)

	var sessionUsr models.SessionUser
	err := row.Scan(&sessionUsr.ID, &sessionUsr.Username, &sessionUsr.DisplayName, &sessionUsr.Email, &sessionUsr.IsSuperuser)

	if err != nil {
		return models.CollectionPermission{}, models.SessionUser{}, fmt.Errorf("Error obtaining session user: %s", err)
	}

	obtainPermissionQuery := `select 
	p.id, p.collections_id, p.action, p.condition
	from permissions p
	where p.action = $1 and p.collection_id = $2 limit 1;`
	row = db.QueryRow(obtainPermissionQuery, action, sessionId)

	var CollectionPermission models.CollectionPermission
	err = row.Scan(&CollectionPermission.ID, &CollectionPermission.CollectionID, &CollectionPermission.Action, &CollectionPermission.Condition)

	if err != nil {
		return models.CollectionPermission{}, models.SessionUser{}, fmt.Errorf("Error obtaining permission for collection: %s", err)
	}

	return CollectionPermission, sessionUsr, nil
}
