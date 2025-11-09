package strparse

import "github.com/Isaac799/devtoolbox/pkg/model"

// RelationMaker helps facilitate the joining of entities across schemas
type RelationMaker struct {
	Schemas []*model.Schema
}

// NewRelationMaker provides a new joiner
func NewRelationMaker(schemas []*model.Schema) *RelationMaker {
	return &RelationMaker{
		Schemas: schemas,
	}
}

// Relation describes the relation ship between 2 entities
type Relation struct {
	Base *model.Entity
	Has  *model.Entity
	Many bool
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
					Base: entity,
					Has:  attr.Final.Parent,
					Many: false,
				})
			}
		}
	}
	return relations
}
