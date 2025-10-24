package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"

	_ "github.com/lib/pq"
)

type DBConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Password string `json:"password"`
	DBName   string `json:"dbname"`
	SSLMode  string `json:"sslmode"`
}

type Config struct {
	Database DBConfig `json:"database"`
}

func Connect() *sql.DB {
	cfg, err := LoadConfig("config.json")
	if err != nil {
		log.Fatalf("Could not open database connection: %v", err)
	}
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Could not open database connection: %v", err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}

	fmt.Println("Database connected successfully.")
	return db
}

func LoadConfig(path string) (*DBConfig, error) {
	configFile, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("could not read config file from path %s: %w", path, err)
	}

	var config Config
	if err := json.Unmarshal(configFile, &config); err != nil {
		return nil, fmt.Errorf("could not parse config file: %w", err)
	}

	return &config.Database, nil
}

func RunMigrations(db *sql.DB, dirPath string) error {
	log.Printf("Searching for migration files in %s", dirPath)

	// 1. Find all files matching the pattern *.sql
	files, err := filepath.Glob(filepath.Join(dirPath, "*.sql"))
	if err != nil {
		return fmt.Errorf("could not find sql files in %s: %w", dirPath, err)
	}
	if len(files) == 0 {
		log.Println("No migration files found to apply.")
		return nil
	}

	// 2. Sort the files alphabetically to ensure correct order
	sort.Strings(files)

	log.Printf("Found %d migration files to apply.", len(files))

	// 3. Loop through each file and execute it
	for _, file := range files {
		log.Printf("Applying migration: %s", filepath.Base(file))

		// 4. Read the file's content
		content, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("could not read migration file %s: %w", file, err)
		}

		// 5. Execute the entire file within a single transaction
		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("could not begin transaction for %s: %w", file, err)
		}

		if _, err := tx.Exec(string(content)); err != nil {
			// If there's an error, rollback the transaction and return the error
			tx.Rollback()
			return fmt.Errorf("failed to execute migration file %s: %w", file, err)
		}

		// If everything was successful, commit the transaction
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit transaction for %s: %w", file, err)
		}
	}

	log.Println("All migrations applied successfully.")
	return nil
}
