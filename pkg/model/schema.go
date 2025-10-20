package model

// Schema is the primary categorizations
type Schema struct {
	Name     string
	Entities []*Entity
}

func (sch *Schema) HasErr() bool {
	for _, ent := range sch.Entities {
		for _, attr := range ent.RawAttributes {
			if attr.Err != nil {
				return true
			}
		}
	}
	return false
}
