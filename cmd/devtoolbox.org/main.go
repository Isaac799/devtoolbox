package main

import (
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
	wss.RegisterHandler(constants.MessageTypeBoilerplate, services.BoilerplateHandler)

	app := &config.App{
		Router:   http.NewServeMux(),
		WSServer: wss,
	}

	routes.RegisterRoutes(app)

	app.Run(":8080")
}
