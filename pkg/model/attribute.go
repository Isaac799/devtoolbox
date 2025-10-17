package model

type AttrKind int

const (
	AttrKindNone AttrKind = iota
	AttrKindBit
	AttrKindDate
	AttrKindChar
	AttrKindTime
	AttrKindTimestamp
	AttrKindDecimal
	AttrKindReal
	AttrKindFloat
	AttrKindSerial
	AttrKindInt
	AttrKindBoolean
	AttrKindVarchar
	AttrKindMoney
	AttrKindReference
)

// Attribute is a metric in an entity, like a column in a table
type Attribute struct {
	Name         string
	Alias        string
	Kind         AttrKind
	DefaultValue string
	Primary      bool
	Unique       []string
	Err          error
	Validation
}
