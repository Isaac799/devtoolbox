package models

// Validation holds validation rules for an attribute
type Validation struct {
	Required bool `yaml:"not_null,omitempty"`
	Min     int  `yaml:"min,omitempty"`
	Max     int  `yaml:"max,omitempty"`
}

// Default holds default value for an attribute
type Default struct {
	Value string `yaml:"value,omitempty"`
}

// Unique holds unique group information for an attribute
type Unique struct {
	GroupName string `yaml:"group_name,omitempty"`
}

// Options holds additional options for attributes and tables
type AttributeOptions struct {
	PrimaryKey bool     `yaml:"primary_key,omitempty"`
	Readonly   bool     `yaml:"readonly,omitempty"`
	Unique     *Unique  `yaml:"unique,omitempty"`  // Use pointer to handle optional field
	Default    *Default `yaml:"default,omitempty"` // Use pointer to handle optional field
}

// Attribute represents an individual attribute of a table
type Attribute struct {
	Type       string           `yaml:"type"`
	Options    AttributeOptions `yaml:"options,omitempty"`
	Validation Validation       `yaml:"validation,omitempty"`
}
