package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"devtoolbox.org/pkg/models"
)

func ClientHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var clientData models.ClientData
	err := json.NewDecoder(r.Body).Decode(&clientData)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	// Process the data (e.g., log it, save it to a database, etc.)
	log.Printf("Received client data: %+v\n", clientData)

	// Respond to the client
	w.WriteHeader(http.StatusOK)
}
