package site

import (
	"github.com/Isaac799/devtoolbox/internal/strgen"
	"github.com/Isaac799/devtoolbox/pkg/model"
)

// InputMode is a preference of user for inputs
type InputMode int

// acceptable input modes
const (
	InputModeText InputMode = iota + 1
	InputModeGraphical
)

// Focus is the gui focus of a user
type Focus struct {
	RawID string

	// zero or one of the following may be set.
	// is pointer to a pointer to allow me to replace it in place
	Schema    **model.Schema
	Entity    **model.Entity
	Attribute **model.AttributeRaw
}

// Input is for template rendering to help retain state
type Input struct {
	Q       string
	Example string
	Focus   Focus
	Mode    InputMode
}

// Output is for template rendering to show what was generated
type Output struct {
	Schemas        []*model.Schema
	GoGen          map[strgen.FileName]string
	PgGen          map[strgen.FileName]string
	OkayToDownload bool
	HasErr         bool
}

func (out *Output) refreshSchemas() {
	for _, schema := range out.Schemas {
		for _, entity := range schema.Entities {
			entity.ClearCache()
			for _, attr := range entity.RawAttributes {
				attr.ClearReferenceErr()
				if attr.Kind == model.AttrKindReference {
					attr.EnsureValidReference(out.Schemas)
				}
			}
		}
	}
}

// Example is preset to show functionality
type Example struct {
	Label string
	Value string
}

// DefaultExamples are preset examples I made to showcase different capabilities
// and levels of complexity
func DefaultExamples() []Example {
	return []Example{
		{
			Label: "Books and People",
			Value: `# People

## Author
- id as ++
- first name as string with unique:full name, required, 3..32
- last name as str with u:full name, u:last name, r, ..30
- dob as date with 2006-01-02..

# Library

## Category
- id as ++
- name as str with u, r, 3..30

## Book
- id as ++
- title as str with u, r, ..50
- published as ts with default:now
- @category with r

## Publication
- @book with primary
- @people.author with primary
- flags as bit with ..16`,
		},
		{
			Label: "Foo Bar",
			Value: `# foo 

## bar 

- id as ++
- name as str with 0..3`,
		},
	}
}

func emptyLastOutput(schemas []*model.Schema) *Output {
	return &Output{
		Schemas: schemas,
		GoGen:   make(map[strgen.FileName]string),
		PgGen:   make(map[strgen.FileName]string, 0),
	}
}
