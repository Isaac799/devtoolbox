package services

import (
	"fmt"

	"devtoolbox.org/pkg/models"
	"github.com/gorilla/websocket"
	"gopkg.in/yaml.v3"
)

func BoilerplateHandler(conn *websocket.Conn, message []byte) {
	schema, err := ParseYAMLFromBytes(message)
	if err != nil {
		fmt.Println("Error parsing YAML:", err)
		conn.WriteMessage(websocket.TextMessage, []byte("Error parsing YAML"))
		return
	}

	summary := GenerateSummary(schema)

	err = conn.WriteMessage(websocket.TextMessage, summary)
	if err != nil {
		fmt.Println("Error sending message:", err)
	}
}

func ParseYAMLFromBytes(data []byte) (models.Schema, error) {
	var schema models.Schema

	err := yaml.Unmarshal(data, &schema)
	if err != nil {
		return schema, err
	}

	return schema, nil
}

func GenerateSummary(schema models.Schema) []byte {
	return []byte("answer.pgsql|create table users (\n\tid serial not null\n)")
}
