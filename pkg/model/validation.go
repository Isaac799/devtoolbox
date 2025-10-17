package model

import "database/sql"

// Validation is optional fields to describe constraints on a value
type Validation struct {
	Required sql.NullBool
	Min      sql.NullFloat64
	Max      sql.NullFloat64
}
