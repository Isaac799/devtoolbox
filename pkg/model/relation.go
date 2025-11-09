package model

import (
	"fmt"
	"strings"

	"github.com/iancoleman/strcase"
)

// RelationMaker helps facilitate the joining of entities across schemas
type RelationMaker struct {
	Schemas []*Schema
}

// NewRelationMaker provides a new joiner
func NewRelationMaker(schemas []*Schema) *RelationMaker {
	return &RelationMaker{
		Schemas: schemas,
	}
}

// Relation describes the relation ship between 2 entities
type Relation struct {
	Base     *Entity
	Has      *Entity
	Many     bool
	Optional bool
}

// Name provides a case corrected name for use in templating
func (rel *Relation) Name() string {
	return strcase.ToSnake(fmt.Sprintf("%s_%s", rel.Base.Name, rel.HasName()))
}

// HasName provides a case corrected name for the has entity use in templating
func (rel *Relation) HasName() string {
	if !rel.Many {
		return rel.Has.Name
	}
	plural := "s"
	lower := strings.ToLower(rel.Has.Name)
	if strings.HasSuffix(lower, "y") || strings.HasSuffix(lower, "s") {
		plural = "ies"
	}
	return rel.Has.Name + plural
}

func (relationMaker *RelationMaker) DetermineFor(ent *Entity) []Relation {
	relations := relationMaker.Determine()
	matches := make([]Relation, 0, len(relations))
	for _, relation := range relations {
		if relation.Base != ent {
			continue
		}
		matches = append(matches, relation)
	}
	return matches
}

// Determine will look at schemas and provide
func (relationMaker *RelationMaker) Determine() []Relation {
	relations := make([]Relation, 0, 20)
	for _, schema := range relationMaker.Schemas {
		for _, entity := range schema.Entities {
			if entity.CompositePrimary() {
				pks := entity.Primary()
				for _, pkA := range pks {
					for _, pkB := range pks {
						if pkA.Attribute.Parent == pkB.Attribute.Parent {
							continue
						}
						relations = append(relations, Relation{
							Base: pkA.Attribute.Parent,
							Has:  pkB.Attribute.Parent,
							Many: true,
						})
					}
				}
				continue
			}
			for _, attr := range entity.Attributes() {
				if attr.DirectChild {
					continue
				}
				relations = append(relations, Relation{
					Base:     entity,
					Has:      attr.Final.Parent,
					Many:     false,
					Optional: !attr.Reference.Source.Required.Bool,
				})
			}
		}
	}
	return relations
}
