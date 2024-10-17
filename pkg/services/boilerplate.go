package services

import (
	"fmt"
	"strings"

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

	summary := GenerateFormattedOutput(schema)

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

func GenerateCreateTableSQL(tableName string, table models.Table) string {
	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("CREATE TABLE %s (\n", tableName))

	for _, attr := range table.Attributes {
		var columnBuilder strings.Builder
		columnBuilder.WriteString(fmt.Sprintf("    %s", attr.Type))

		// Handle attribute options
		if attr.Validation.NotNull {
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

func GenerateFormattedOutput(schema models.Schema) []byte {
	var builder strings.Builder

	for tableName, table := range schema.Tables {
		sql := GenerateCreateTableSQL(tableName, table)
		builder.WriteString(fmt.Sprintf("%s.pgsql|%s", tableName, sql))
	}

	return []byte(builder.String())
}
