package main

import (
	"log"
	"net/http"
	"time"

	"devtoolbox.org/internal/config"
	"devtoolbox.org/internal/constants"
	"devtoolbox.org/internal/routes"
	"devtoolbox.org/pkg/models"
	"devtoolbox.org/pkg/services"
)

func main() {
	wss := models.NewWebSocketServer(1*time.Second, 10)
	wss.RegisterHandler(constants.MessageTypeBoilerplate, services.ReverseHandler)

	dbPath := "./sessions.db"
	store, err := models.NewSessionStore(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize session store: %v", err)
	}

	app := &config.App{
		Router:   http.NewServeMux(),
		WSServer: wss,
		Store:    store,
	}

	routes.RegisterRoutes(app)

	app.Run(":8080")
}
