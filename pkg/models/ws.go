package models

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type MessageHandler func(conn *websocket.Conn, message []byte)

type WebSocketServer struct {
	upgrader     websocket.Upgrader
	clients      map[*websocket.Conn]bool
	mu           sync.Mutex
	debounceTime time.Duration
	maxClients   int
	handlers     map[string]MessageHandler
}

func NewWebSocketServer(debounceTime time.Duration, maxClients int) *WebSocketServer {
	return &WebSocketServer{
		clients:      make(map[*websocket.Conn]bool),
		debounceTime: debounceTime,
		maxClients:   maxClients,
		handlers:     make(map[string]MessageHandler),
	}
}

func (ws *WebSocketServer) RegisterHandler(messageType string, handler MessageHandler) {
	ws.handlers[messageType] = handler
}

func (ws *WebSocketServer) HandleWebSocket(messageType string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ws.mu.Lock()
		if len(ws.clients) >= ws.maxClients {
			ws.mu.Unlock()
			http.Error(w, "Maximum clients limit reached", http.StatusTooManyRequests)
			return
		}

		conn, err := ws.upgrader.Upgrade(w, r, nil)
		if err != nil {
			ws.mu.Unlock()
			fmt.Println("Error upgrading connection:", err)
			return
		}

		ws.clients[conn] = true
		ws.mu.Unlock()

		defer conn.Close()

		var lastMessage []byte
		var debounceTimer *time.Timer

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				break
			}

			lastMessage = msg

			if debounceTimer != nil {
				debounceTimer.Stop()
			}

			debounceTimer = time.AfterFunc(ws.debounceTime, func() {
				if handler, exists := ws.handlers[messageType]; exists {
					handler(conn, lastMessage)
				} else if defaultHandler, exists := ws.handlers["default"]; exists {
					defaultHandler(conn, lastMessage)
				}
			})
		}

		ws.mu.Lock()
		delete(ws.clients, conn)
		ws.mu.Unlock()
	}
}

func (ws *WebSocketServer) Broadcast(message []byte) {
	ws.mu.Lock()
	defer ws.mu.Unlock()
	for client := range ws.clients {
		err := client.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			fmt.Println("Error writing message:", err)
			client.Close()
			delete(ws.clients, client)
		}
	}
}
