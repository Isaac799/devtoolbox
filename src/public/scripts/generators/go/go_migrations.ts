import { trimAndRemoveBlankStrings } from '../../core/formatting';
import { CodeGenerator, FileOutputs } from '../../core/structure';
import { SqlGenerator } from '../sql/postgres_sql';

export class GoMigrations extends CodeGenerator {
        Run() {
                let migration = `package main

import (
    "database/sql"
    "fmt"
    "io"
    "log"
    "os"
    "path/filepath"
    "time"

    _ "github.com/lib/pq"
)

// RunMigrations connects to the database and applies migrations
func RunMigrations(adminConnStr, dbName string) error {
    // Create the database
    if err := createDatabase(adminConnStr, dbName); err != nil {
        return fmt.Errorf("failed to create database: %w", err)
    }
    defer func() {
        if err := deleteDatabase(adminConnStr, dbName); err != nil {
            log.Printf("failed to delete database: %v", err)
        }
    }()

    // Connect to the new database
    connStr := fmt.Sprintf("user=username dbname=%s sslmode=disable", dbName) // Update as needed
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        return fmt.Errorf("failed to connect to the database: %w", err)
    }
    defer db.Close()

    // Perform migrations
    return applyMigrations(db)
}

func createDatabase(connStr, dbName string) error {
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        return fmt.Errorf("failed to connect to PostgreSQL server: %w", err)
    }
    defer db.Close()

    _, err = db.Exec(fmt.Sprintf("CREATE DATABASE %s;", dbName))
    if err != nil {
        return fmt.Errorf("failed to create database %s: %w", dbName, err)
    }
    log.Printf("Database %s created successfully.\n", dbName)
    return nil
}

func deleteDatabase(connStr, dbName string) error {
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        return fmt.Errorf("failed to connect to PostgreSQL server: %w", err)
    }
    defer db.Close()

    _, err = db.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s;", dbName))
    if err != nil {
        return fmt.Errorf("failed to delete database %s: %w", dbName, err)
    }
    log.Printf("Database %s deleted successfully.\n", dbName)
    return nil
}

func applyMigrations(db *sql.DB) error {
    files, err := os.ReadDir("migrations")
    if err != nil {
        return fmt.Errorf("failed to read migrations directory: %w", err)
    }

    for _, file := range files {
        if filepath.Ext(file.Name()) != ".sql" {
            continue // Skip non-SQL files
        }

        path := filepath.Join("migrations", file.Name())
        sqlFile, err := os.Open(path)
        if err != nil {
            return fmt.Errorf("failed to open file %s: %w", file.Name(), err)
        }
        defer sqlFile.Close()

        sqlBytes, err := io.ReadAll(sqlFile)
        if err != nil {
            return fmt.Errorf("failed to read file %s: %w", file.Name(), err)
        }

        if _, err := db.Exec(string(sqlBytes)); err != nil {
            return fmt.Errorf("failed to execute migration %s: %w", file.Name(), err)
        }

        log.Printf("Applied migration: %s\n", file.Name())
    }
    return nil
}

// GenerateMigration creates a new migration file with the current timestamp and provided name
func GenerateMigration(name string) error {
    timestamp := time.Now().Format("20060102150405") // Format: YYYYMMDDHHMMSS
    filename := fmt.Sprintf("%s_%s.sql", timestamp, name)
    migrationsDir := "migrations"

    // Ensure the migrations directory exists
    if err := os.MkdirAll(migrationsDir, os.ModePerm); err != nil {
        return fmt.Errorf("failed to create migrations directory: %w", err)
    }

    // Create the migration file
    filePath := filepath.Join(migrationsDir, filename)
    file, err := os.Create(filePath)
    if err != nil {
        return fmt.Errorf("failed to create migration file %s: %w", filename, err)
    }
    defer file.Close()

    // Write a basic template for the migration
    migrationTemplate := "-- Migration: %s\n-- Created on: %s\n\n-- TODO: Write migration SQL\n"
    if _, err := file.WriteString(fmt.Sprintf(migrationTemplate, name, time.Now().Format(time.RFC1123))); err != nil {
        return fmt.Errorf("failed to write to migration file %s: %w", filename, err)
    }

    log.Printf("Migration file created: %s\n", filePath)
    return nil
}
`;

                let main = `package main

import (
    "flag"
    "log"
)

func main() {
    helpFlag := flag.Bool("help", false, "Show help information")
    envFlag := flag.String("env", "dev", "Environment (dev or prod)")
    genMigrationFlag := flag.String("generate-migration", "", "Generate a new migration file with the given name")
    flag.Parse()

    if *helpFlag {
        showHelp()
        return
    }

    cfg := GetConfig(*envFlag)

    // Generate a new migration file if requested
    if *genMigrationFlag != "" {
        if err := GenerateMigration(*genMigrationFlag); err != nil {
            log.Fatalf("Failed to generate migration: %v", err)
        }
        return
    }

    // Run migrations
    if err := RunMigrations(cfg.AdminConn, cfg.DBName); err != nil {
        log.Fatalf("Migration failed: %v", err)
    }
}

func showHelp() {
    log.Println("Usage: go run main.go [options]")
    log.Println("Options:")
    log.Println("  -help                  Show help information")
    log.Println("  -env                   Environment (dev or prod) (default: dev)")
    log.Println("  -generate-migration    Generate a new migration file with the given name")
}
`;

                let config = `package main

// Config holds the database configuration
type Config struct {
    DBName    string
    AdminConn string
}

// GetConfig returns the configuration based on the environment
func GetConfig(env string) Config {
    if env == "prod" {
        return Config{
            DBName:    "proddb",
            AdminConn: "user=produser sslmode=disable",
        }
    }
    // Default to development config
    return Config{
        DBName:    "devdb",
        AdminConn: "user=devuser sslmode=disable",
    }
}
`;

                let sqlGen = new SqlGenerator();

                let sql = sqlGen.Clear().SetInput(this.input).RunAsMigration();
                sql = trimAndRemoveBlankStrings(sql);

                let sqlCreateTables: FileOutputs = {};

                function getCurrentTimestamp(counter: number) {
                        const now = new Date();

                        // Adjust the seconds based on the counter
                        const adjustedSeconds = now.getSeconds() + counter;

                        // Create a new Date object with adjusted seconds
                        const adjustedDate = new Date(now.setSeconds(adjustedSeconds));

                        return `${adjustedDate.getFullYear()}${String(adjustedDate.getMonth() + 1).padStart(2, '0')}${String(adjustedDate.getDate()).padStart(
                                2,
                                '0'
                        )}${String(adjustedDate.getHours()).padStart(2, '0')}${String(adjustedDate.getMinutes()).padStart(2, '0')}${String(
                                adjustedDate.getSeconds()
                        ).padStart(2, '0')}`;
                }

                let counter = 0;

                for (const key in sql) {
                        if (!Object.prototype.hasOwnProperty.call(sql, key)) {
                                continue;
                        }
                        counter += 1;

                        const e = sql[key];
                        const timestamp = getCurrentTimestamp(counter);
                        // Construct the file name
                        const fileName = `${timestamp}_create_${key}.sql`.replace(/ /g, '_');
                        // Assign the SQL statement to the respective file path
                        sqlCreateTables[`/scripts/migration/migrations/${fileName}`] = e;
                }

                this.output = {
                        '/scripts/migration/main.go': main,
                        '/scripts/migration/migration.go': migration,
                        '/scripts/migration/config.go': config,
                        ...sqlCreateTables,
                };
                return this;
        }
}
