package models

// Schema represents the entire schema containing multiple tables
type Schema struct {
	Name   string           `yaml:"name"`
	Tables map[string]Table `yaml:"tables"`
}

// Schemas represents the entire database containing multiple schemas
type Schemas struct {
	Schemas map[string]Schema `yaml:"schemas"`
}
