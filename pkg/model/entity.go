package model

// Entity is an entity in a schema
type Entity struct {
	Name       string
	Attributes []*Attribute
}
