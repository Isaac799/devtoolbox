package config

import (
	"log"
	"net/http"

	"devtoolbox.org/pkg/models"
)

type App struct {
	Router   *http.ServeMux
	WSServer *models.WebSocketServer
}

func (a *App) Run(addr string) {
	log.Printf("Starting server on %s", addr)
	if err := http.ListenAndServe(addr, a.Router); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
