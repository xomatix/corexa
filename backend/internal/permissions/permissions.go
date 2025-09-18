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

func LogInUser(db *sql.DB, username string, password string) (models.SessionUser, error) {
	obtainUserQuery := `select 
	u.id, u.username, u.display_name, u.email, u.is_superuser
	from users u
	where u.username = $1 and u.is_active = 1 and u.password = md5($2) limit 1;`
	row := db.QueryRow(obtainUserQuery, username, password)

	var sessionUsr models.SessionUser
	err := row.Scan(&sessionUsr.ID, &sessionUsr.Username, &sessionUsr.DisplayName, &sessionUsr.Email, &sessionUsr.IsSuperuser)

	if err != nil {
		return models.SessionUser{}, fmt.Errorf("Error logging in user matching username and password not found: %s", err)
	}

	clearSessionsQuery := `delete from sessions where expires_at < NOW();`
	db.Exec(clearSessionsQuery)

	insertSessionQuery := `insert into sessions (users_id, expires_at) values ($1, NOW() + INTERVAL '30 minutes') returning id;`
	row = db.QueryRow(insertSessionQuery, sessionUsr.ID)

	err = row.Scan(&sessionUsr.SessionID)

	if err != nil {
		return models.SessionUser{}, fmt.Errorf("Error starting session for user: %s", err)
	}

	return sessionUsr, nil
}

func GetSessionUser(db *sql.DB, sessionId string) (models.SessionUser, error) {

	obtainUserQuery := `select 
		u.id, u.username, coalesce(u.display_name, ''),coalesce(u.email, ''), u.is_superuser
	from sessions s join users u on u.id = s.users_id 
	where (s.expires_at > now() or s.expires_at is null) and s.id = $1 and u.is_active = TRUE limit 1;`
	row := db.QueryRow(obtainUserQuery, sessionId)

	var sessionUsr models.SessionUser
	err := row.Scan(&sessionUsr.ID, &sessionUsr.Username, &sessionUsr.DisplayName, &sessionUsr.Email, &sessionUsr.IsSuperuser)

	if err != nil {
		return models.SessionUser{}, fmt.Errorf("Error obtaining session user: %s", err)
	}

	return sessionUsr, nil
}

func HasPermission(db *sql.DB, sessionId, collectionId, action string) (bool, error) {
	usr, err := GetSessionUser(db, sessionId)

	if len(collectionId) != 36 ||
		string(collectionId[8]) != "-" ||
		string(collectionId[13]) != "-" ||
		string(collectionId[18]) != "-" ||
		string(collectionId[23]) != "-" ||
		err != nil {
		return usr.IsSuperuser || false, err
	}

	hasPermissionQuery := `
	select count(cp.*) > 0 
	from collection_permissions cp 
	join (
		select 
			permissions_id 
		from user_permissions up 
		where up.user_id = $1
		union all 
		select 
			rp.permissions_id  
		from user_roles ur 
		join role_permissions rp 
		on ur.role_id = rp.role_id  
		where ur.user_id  = $1
	) p on p.permissions_id = cp.permissions_id 
	where cp.collections_id = $2
	and cp.action = $3
	`
	row := db.QueryRow(hasPermissionQuery, usr.ID, collectionId, action)

	var hasPermission bool
	err = row.Scan(&hasPermission)

	if err == nil {
		err = fmt.Errorf("access denied: user does not have '%s' permission on collection", action)
	}

	return usr.IsSuperuser || hasPermission, err
}
