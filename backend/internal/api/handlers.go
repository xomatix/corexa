package api

import (
	"corexa/internal/config"
	"corexa/internal/models"
	"corexa/internal/permissions"
	"corexa/internal/service"
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SaveHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.SaveRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		cfg, exists := config.GetCollectionConfig(req.Collection)
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "collection not found"})
			return
		}

		var action string
		switch req.Action {
		case models.DeleteAction:
			action = "d"
		case models.InsertAction:
			action = "c"
		case models.UpdateAction:
			action = "u"
		}

		hasPermission, err := permissions.HasPermission(db, req.SessionId, cfg.ID, action)
		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{
				"error": fmt.Sprintf("Access denied: you do not have permission to perform this action. %s", err.Error()),
			})
			return
		}

		data := req.Data
		delete(data, "expand")

		keys := make([]string, 0, len(data))
		for k := range data {
			keys = append(keys, k)
		}

		for _, key := range keys {
			if _, ok := cfg.Fields[key]; !ok {
				delete(data, key)
			} else {

			}
		}
		req.Data = data

		if req.Collection == "collections" || req.Collection == "fields" {
			result, err := service.SaveCollection(db, req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, result)
			config.LoadConfig(db)
			return
		}

		// #TODO
		result, err := service.HandleSave(db, req, cfg)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, result)
	}
}

// #TODO
func SelectHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.SelectRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		cfg, exists := config.GetCollectionConfig(req.Collection)
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "collection not found"})
			return
		}

		hasPermission, err := permissions.HasPermission(db, req.SessionId, cfg.ID, "r")
		if !hasPermission {
			if err != nil {
				c.JSON(http.StatusForbidden, gin.H{
					"error": fmt.Sprintf("Access denied: you do not have permission to perform this action. %s", err.Error()),
				})
				return
			}
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Access denied: you do not have permission to perform this action.",
			})
			return
		}

		if req.Pagination.Limit == 0 {
			req.Pagination.Limit = 10
		}

		response, err := service.HandleSelect(db, req, cfg)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, response)
	}
}

func InvokeSelectHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.InvokeSelectRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		sessionUser, err := permissions.GetSessionUser(db, req.SessionId)
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": fmt.Sprintf("Access denied: you do not have permission to perform this action. %s", err.Error()),
			})
			return
		}

		if req.Pagination.Limit == 0 {
			req.Pagination.Limit = 10
		}

		response, err := service.HandleInvokeSelect(db, req, sessionUser)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, response)
	}
}

func ConfigHandler(c *gin.Context) {
	c.JSON(http.StatusOK, config.ConfigCache)
}

func LogInHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		usrCfg, err := permissions.LogInUser(db, req.Username, req.Password)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": fmt.Sprintf("Not logged in: %s", err.Error())})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"session_id":   usrCfg.SessionID,
			"username":     usrCfg.Username,
			"display_name": usrCfg.DisplayName,
			"email":        usrCfg.Email,
			"is_superuser": usrCfg.IsSuperuser,
		})
	}
}

func UsrPermissionsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.SelectRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		sessionUser, err := permissions.GetSessionUser(db, req.SessionId)
		if err != nil {
			c.JSON(http.StatusMethodNotAllowed, gin.H{"error": fmt.Sprintf("No permissions found for session user: %s", err.Error())})
			return
		}

		obtainUserQuery := `select p.id as permissions_id, p."name" 
				from user_permissions up 
				inner join permissions p on (up.permissions_id = p.id)
				where up.user_id = $1
			union all 
				select p.id as permissions_id, p."name"
				from user_roles ur 
				inner join role_permissions rp on (ur.role_id = rp.role_id)
				inner join permissions p on (p.id = rp.permissions_id)
				where ur.user_id = $2;`
		rows, err := db.Query(obtainUserQuery, sessionUser.ID, sessionUser.ID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Error obtaining permissions for session user: %s", err.Error())})
			return
		}

		usrPermissions, err := service.ScanRowsToMaps(rows)
		if err != nil {
			c.JSON(http.StatusNoContent, gin.H{"error": fmt.Sprintf("No permissions found for session user: %s", err.Error())})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": usrPermissions,
		})
	}
}
