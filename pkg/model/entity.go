package model

import (
	"fmt"
	"strings"
)

// Entity is an entity in a schema
type Entity struct {
	Name   string
	Parent *Schema

	// RawAttributes is typically not to be used. Please use
	// Attributes fn to get correct list.
	RawAttributes []*AttributeRaw

	// all attributes after cached
	ar []*Attribute
}

// String provides parsable text to generate itself
func (ent *Entity) String() string {
	return fmt.Sprintf("## %s", ent.Name)
}

// Attribute is a attribute discovered curing recursion.
// Helps with a fuller picture of what an entity is, flattening
// its references out.
type Attribute struct {
	Attribute *AttributeRaw

	// DirectChild protects usage of reference
	DirectChild bool
	Reference
}

// Reference is relevant if attribute is a reference type
type Reference struct {
	Source        *AttributeRaw
	Final         *AttributeRaw
	ChangedSchema bool
	Path          string
}

// Name is a naming convention, template friendly alias, for
// attributes found, takeing into account the 'path to get there'
func (attr *Attribute) Name() string {
	a := strings.ReplaceAll(attr.Path, "/", "_")
	b := strings.ReplaceAll(a, ".", "_")
	return strings.Trim(b, "_")
}

func (ent *Entity) attributes(n, max int, path string, collection *[]*Attribute, source *AttributeRaw) []*Attribute {
	if n > max {
		// todo attach info err to attr or entity
		return *collection
	}

	for _, attr := range ent.RawAttributes {
		if len(attr.Err) > 0 {
			continue
		}

		s := attr.Name
		if len(attr.Alias) > 0 {
			s = attr.Alias
		}
		p := fmt.Sprintf("%s/%s", path, s)

		src := source
		if src == nil {
			src = attr
		}

		if attr.ReferenceTo != nil {
			attr.ReferenceTo.attributes(n+1, max, p, collection, src)
			continue
		}

		if n > 0 && !attr.Primary {
			continue
		}

		*collection = append(*collection, &Attribute{
			Attribute:   attr,
			DirectChild: n == 0,
			Reference: Reference{
				Path:          p,
				Source:        src,
				Final:         attr,
				ChangedSchema: src.Parent.Parent != attr.Parent.Parent,
			},
		})
	}

	return *collection
}

// Attributes provides recursive list of attributes, so references are
// made primitive
func (ent *Entity) Attributes() []*Attribute {
	if len(ent.ar) > 0 {
		return ent.ar
	}

	max := 5

	attrs := make([]*Attribute, 0, len(ent.RawAttributes)*max)

	result := ent.attributes(0, max, "", &attrs, nil)
	ent.ar = result
	return result
}

func (ent *Entity) CompositePrimary() bool {
	return len(ent.Primary()) > 1
}

// AttributesToCreate provides recursive list of attributes for create operations.
// Similar to AttributesToUpdate, but kept separate in case I want to change them later.
func (ent *Entity) AttributesToCreate() []*Attribute {
	var (
		attrs     = ent.Attributes()
		ok        = make([]*Attribute, 0, len(attrs))
		composite = ent.CompositePrimary()
	)

	for _, attr := range attrs {
		if !composite && attr.Source.Primary {
			continue
		}
		if len(attr.Source.DefaultValue) > 0 {
			continue
		}
		ok = append(ok, attr)
	}

	return ok
}

// AttributesToUpdate provides recursive list of attributes for update operations
// Similar to AttributesToCreate, but kept separate in case I want to change them later.
func (ent *Entity) AttributesToUpdate() []*Attribute {
	var (
		attrs     = ent.Attributes()
		ok        = make([]*Attribute, 0, len(attrs))
		composite = ent.CompositePrimary()
	)

	for _, attr := range attrs {
		if !composite && attr.Source.Primary {
			continue
		}
		if len(attr.Source.DefaultValue) > 0 {
			continue
		}
		ok = append(ok, attr)
	}

	return ok
}

// Primary is a arr of attr that make up primary
func (ent *Entity) Primary() []*Attribute {
	attrs := make([]*Attribute, 0, len(ent.Attributes()))
	for _, attr := range ent.Attributes() {
		// if from derived from a reference we care about the options
		// applied to the source table
		if attr.Source.Primary {
			attrs = append(attrs, attr)
		}
	}
	return attrs
}

// NonPrimary is a arr of attr that make up non primary keys
// useful in templating
func (ent *Entity) NonPrimary() []*Attribute {
	attrs := make([]*Attribute, 0, len(ent.Attributes()))
	for _, attr := range ent.Attributes() {
		if attr.Source.Primary {
			continue
		}
		attrs = append(attrs, attr)
	}
	return attrs
}

// Unique is a map of uniques
func (ent *Entity) Unique() map[string][]*Attribute {
	attrs := make(map[string][]*Attribute, 3)
	for _, attr := range ent.Attributes() {
		for _, label := range attr.Source.Unique {
			if attrs[label] == nil {
				attrs[label] = make([]*Attribute, 0, 3)
			}
			attrs[label] = append(attrs[label], attr)
		}
	}
	return attrs
}

// UniqueList is 2d arr of uniques used for templating
func (ent *Entity) UniqueList() [][]*Attribute {
	uniques := ent.Unique()
	arr := make([][]*Attribute, 0, 10)
	for _, v := range uniques {
		arr = append(arr, v)
	}
	return arr
}

// ReferenceList is a list of references used for templating
func (ent *Entity) ReferenceList() []*Attribute {
	arr := make([]*Attribute, 0, 10)
	for _, v := range ent.Attributes() {
		if v.DirectChild {
			continue
		}
		arr = append(arr, v)
	}
	return arr
}

// HasPrimary is easy way to see if primaries are relevant
func (ent *Entity) HasPrimary() bool {
	return len(ent.Primary()) > 0
}

// HasUnique is easy way to see if uniques is relevant
func (ent *Entity) HasUnique() bool {
	for _, v := range ent.Unique() {
		if len(v) > 0 {
			return true
		}
	}
	return false
}

// HasReference is easy way to see if references is relevant
// for templating
func (ent *Entity) HasReference() bool {
	for _, v := range ent.Attributes() {
		if !v.DirectChild {
			return true
		}
	}
	return false
}

// HasValidity is easy way to see if an entity needs validity checks
// for templating
func (ent *Entity) HasValidity() bool {
	for _, v := range ent.AttributesToCreate() {
		val := v.Source.Validation
		if val.Max.Valid || val.Min.Valid || val.Required.Valid {
			return true
		}
	}
	return false
}
