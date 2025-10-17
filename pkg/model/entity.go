package model

// Entity is an entity in a schema
type Entity struct {
	Name       string
	Attributes []*Attribute
}

// Primary is a arr of attr that make up primary
func (ent *Entity) Primary() []*Attribute {
	attrs := make([]*Attribute, 0, len(ent.Attributes))
	for _, attr := range ent.Attributes {
		if attr.Err != nil {
			continue
		}
		if !attr.Primary {
			continue
		}
		attrs = append(attrs, attr)
	}
	return attrs
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

// PrimaryList is a list of pks for templating
func (ent *Entity) PrimaryList() []string {
	primary := ent.Primary()
	attrs := make([]string, 0, len(primary))
	for _, attr := range primary {
		attrs = append(attrs, attr.Name)
	}
	return attrs
}

// Unique is a map of uniques
func (ent *Entity) Unique() map[string][]*Attribute {
	attrs := make(map[string][]*Attribute, 3)
	for _, attr := range ent.Attributes {
		if attr.Err != nil {
			continue
		}
		for _, label := range attr.Unique {
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
