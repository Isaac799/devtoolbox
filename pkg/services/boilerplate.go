package services

import (
	"fmt"

	"github.com/gorilla/websocket"
)

func ReverseHandler(conn *websocket.Conn, message []byte) {
	reversed := reverseString(string(message))
	err := conn.WriteMessage(websocket.TextMessage, []byte(reversed))
	if err != nil {
		fmt.Println("Error sending message:", err)
	}
}

func reverseString(s string) string {
	runes := []rune(s)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}
