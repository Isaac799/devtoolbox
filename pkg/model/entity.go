package model

// Entity is an entity in a schema
type Entity struct {
	Name       string
	Attributes []*Attribute
}

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

func (ent *Entity) HasPrimary() bool {
	return len(ent.Primary()) > 0
}

func (ent *Entity) PrimaryList() []string {
	primary := ent.Primary()
	attrs := make([]string, 0, len(primary))
	for _, attr := range primary {
		attrs = append(attrs, attr.Name)
	}
	return attrs
}

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
