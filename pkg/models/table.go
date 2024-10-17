package models

// Options holds additional options for attributes and tables
type TableOptions struct {
	AutoPrimaryKey bool `yaml:"auto_primary_key,omitempty"`
	AutoTimestamps bool `yaml:"auto_timestamps,omitempty"`
}

// Table represents a database table with its attributes and options
type Table struct {
	Options    TableOptions         `yaml:"options,omitempty"`
	Attributes map[string]Attribute `yaml:"attributes"`
}
