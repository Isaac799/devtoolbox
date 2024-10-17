package models

// Schema represents the entire schema containing multiple tables
type Schema struct {
	Name   string           `yaml:"name"`
	Tables map[string]Table `yaml:"tables"`
}
