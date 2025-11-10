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
	Assoc    *Entity
	Optional bool
}

// Name provides a case corrected name for use in templating
func (rel *Relation) Name() string {
	return strcase.ToSnake(fmt.Sprintf("%s_%s", rel.Base.Name, rel.HasName()))
}

// HasName provides a case corrected name for the has entity use in templating
func (rel *Relation) HasName() string {
	if rel.Assoc == nil {
		return rel.Has.Name
	}
	plural := "s"
	lower := strings.ToLower(rel.Has.Name)
	if strings.HasSuffix(lower, "y") || strings.HasSuffix(lower, "s") {
		plural = "ies"
	}
	return rel.Has.Name + plural
}

// KeysForDirectRelation returns a list of pk that make up the relation between 2 entities
func (rel *Relation) KeysForDirectRelation() []*Attribute {
	pks := rel.Base.Primary()
	overlap := make([]*Attribute, 0, len(pks))
	for _, attr := range rel.Base.Attributes() {
		if attr.DirectChild {
			continue
		}
		a := attr.Reference.Final.Parent
		b := rel.Has
		if a == b {
			overlap = append(overlap, attr)
		}
	}
	return overlap
}

// KeysForAssocRelation returns two list of pk that make up the relation between 2 entities
// going though an associative entity
func (rel *Relation) KeysForAssocRelation() [2][]*Attribute {
	pks := rel.Base.Primary()
	overlap := [2][]*Attribute{
		make([]*Attribute, 0, len(pks)),
		make([]*Attribute, 0, len(pks)),
	}
	for _, attr := range rel.Assoc.Attributes() {
		if attr.DirectChild {
			continue
		}
		a := attr.Reference.Final.Parent
		b := rel.Base
		if a == b {
			overlap[0] = append(overlap[0], attr)
		}
	}
	for _, attr := range rel.Assoc.Attributes() {
		if attr.DirectChild {
			continue
		}
		a := attr.Reference.Final.Parent
		b := rel.Has
		if a == b {
			overlap[1] = append(overlap[1], attr)
		}
	}
	return overlap
}

// DetermineFor determines the relations for an entity
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
						candidate := Relation{
							Base:     pkA.Attribute.Parent,
							Has:      pkB.Attribute.Parent,
							Assoc:    entity,
							Optional: true,
						}

						// prevents duplicate on composite pk
						distinct := true
						for _, rel := range relations {
							if rel.Base == candidate.Base && rel.Has == candidate.Has {
								distinct = false
								break
							}
						}
						if !distinct {
							continue
						}

						relations = append(relations, candidate)
					}
				}
				continue
			}

			for _, attr := range entity.Attributes() {
				if attr.DirectChild {
					continue
				}
				candidate := Relation{
					Base:     entity,
					Has:      attr.Final.Parent,
					Optional: !attr.Reference.Source.Required.Bool,
				}

				// prevents duplicate on composite pk
				distinct := true
				for _, rel := range relations {
					if rel.Base == candidate.Base && rel.Has == candidate.Has {
						distinct = false
						break
					}
				}
				if !distinct {
					continue
				}

				relations = append(relations, candidate)
			}
		}
	}
	return relations
}
