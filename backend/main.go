package main

import (
	"corexa/internal/api"
	"corexa/internal/config"
	"corexa/internal/database"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Connect to DB
	db := database.Connect()
	defer db.Close()

	// 2. Run Database Migrations
	if err := database.RunMigrations(db, "sql"); err != nil {
		log.Fatalf("Could not run database migrations: %v", err)
	}

	// 3. Load schema configuration into memory
	if err := config.LoadConfig(db); err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}
	// 4. Set up Gin router
	r := gin.Default()

	// #TODO
	// CORS Middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "*"},
		AllowMethods:     []string{"POST", "GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}))

	// API Routes
	apiGroup := r.Group("/api")
	{
		apiGroup.POST("/save", api.SaveHandler(db))
		apiGroup.POST("/select", api.SelectHandler(db))
		apiGroup.GET("/config", api.ConfigHandler)
		apiGroup.POST("/login", api.LogInHandler(db))
	}

	// #TODO init logic
	log.Println("Starting server on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
