package api

import (
	"corexa/internal/config"
	"corexa/internal/models"
	"corexa/internal/service"
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

// #TODO
func SaveHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// ... function body is exactly the same
		// #TODO
		var req models.SaveRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// #TODO manage permission
		// if err := permissions.GetPermission("user123", req.Collection, req.Action); err != nil {
		// 	c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		// 	return
		// }

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
		cfg, exists := config.GetCollectionConfig(req.Collection)
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "collection not found"})
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

// #TODO
// ConfigHandler remains the same
func ConfigHandler(c *gin.Context) {
	c.JSON(http.StatusOK, config.ConfigCache)
}
