package model

import (
	"crypto/rand"
	"fmt"
	"strings"

	"github.com/Isaac799/devtoolbox/internal"
)

// Schema is the primary categorizations
type Schema struct {
	ID string

	Name     string
	Entities []*Entity
}

func NewSchema() *Schema {
	return &Schema{
		ID:       rand.Text(),
		Name:     internal.NewFallbackName(),
		Entities: make([]*Entity, 0, 3),
	}
}

// Path is a unique accessor value for focusing via the ux
func (sch *Schema) Path() string {
	return strings.Join([]string{
		sch.Name,
	}, "/")
}

func (sch *Schema) HasErr() bool {
	for _, ent := range sch.Entities {
		for _, attr := range ent.RawAttributes {
			if attr.HasErr() {
				return true
			}
		}
	}
	return false
}

// String provides parsable text to generate itself
func (sch *Schema) String() string {
	opts := []string{}

	optsStr := strings.Join(opts, ", ")

	return fmt.Sprintf("# %s with %s", sch.Name, optsStr)
}
