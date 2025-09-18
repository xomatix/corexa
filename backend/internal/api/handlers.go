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
			c.JSON(http.StatusForbidden, gin.H{
				"error": fmt.Sprintf("Access denied: you do not have permission to perform this action. %s", err.Error()),
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
