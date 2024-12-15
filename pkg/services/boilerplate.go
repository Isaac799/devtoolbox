package services

import (
	"fmt"
	"strings"

	"devtoolbox.org/pkg/models"
	"github.com/gorilla/websocket"
	"gopkg.in/yaml.v3"
)

// BoilerplateHandler handles incoming WebSocket messages
func BoilerplateHandler(conn *websocket.Conn, message []byte) {
	database, err := ParseYAMLFromBytes(message)
	if err != nil {
		fmt.Println("Error parsing YAML:", err)
		conn.WriteMessage(websocket.TextMessage, []byte("Error parsing YAML"))
		return
	}

	summary := GenerateFormattedOutput(database)

	err = conn.WriteMessage(websocket.TextMessage, summary)
	if err != nil {
		fmt.Println("Error sending message:", err)
	}
}

// ParseYAMLFromBytes parses YAML data into a Database struct
func ParseYAMLFromBytes(data []byte) (models.Schemas, error) {
	var database models.Schemas

	err := yaml.Unmarshal(data, &database)
	if err != nil {
		return database, err
	}

	return database, nil
}

// GenerateCreateTableSQL generates SQL for creating a table
func GenerateCreateTableSQL(tableName string, table models.Table) string {
	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("CREATE TABLE %s (\n", tableName))

	for name, attr := range table.Attributes {
		var columnBuilder strings.Builder
		columnBuilder.WriteString(fmt.Sprintf("    %s %s", name, attr.Type))

		// Handle attribute options
		if attr.Validation.Required {
			columnBuilder.WriteString(" NOT NULL")
		}
		if attr.Options.Default != nil {
			columnBuilder.WriteString(fmt.Sprintf(" DEFAULT '%s'", attr.Options.Default.Value))
		}
		if attr.Options.PrimaryKey {
			columnBuilder.WriteString(" PRIMARY KEY")
		}
		if attr.Options.Unique != nil {
			columnBuilder.WriteString(fmt.Sprintf(" UNIQUE (%s)", attr.Options.Unique.GroupName))
		}

		builder.WriteString(columnBuilder.String() + ",\n")
	}

	// Remove the last comma and newline if attributes exist
	output := builder.String()
	if len(table.Attributes) > 0 {
		output = output[:len(output)-2] // Remove the last ",\n"
	}
	output += "\n);\n"

	return output
}

// GenerateFormattedOutput generates a formatted output of the database schema
func GenerateFormattedOutput(database models.Schemas) []byte {
	var builder strings.Builder

	for schemaName, schema := range database.Schemas {
		for tableName, table := range schema.Tables {
			sql := GenerateCreateTableSQL(tableName, table)
			builder.WriteString(fmt.Sprintf("Schema: %s\nTable: %s\nSQL:\n%s\n", schemaName, tableName, sql))
		}
	}

	return []byte(builder.String())
}
