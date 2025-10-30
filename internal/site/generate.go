package site

import (
	"strings"

	"github.com/Isaac799/devtoolbox/internal/strgen"
	"github.com/Isaac799/devtoolbox/internal/strparse"
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
	Path string

	// one of the following
	Schema    *model.Schema
	Entity    *model.Entity
	Attribute *model.AttributeRaw
}

// Input is for template rendering to help retain state
type Input struct {
	Q       string
	Example string
	Focus   Focus
	Mode    InputMode
}

// SetFocus sets the focus based on its path, given schemas
func (focus *Focus) SetFocus(schemas []*model.Schema) {
	focus.Schema = nil
	focus.Entity = nil
	focus.Attribute = nil

	if len(focus.Path) == 0 {
		return
	}

	schemaStr, s, _ := strings.Cut(focus.Path, "/")
	entityStr, attrStr, _ := strings.Cut(s, "/")

	for _, schema := range schemas {
		if schema.Name != schemaStr {
			continue
		}
		if schema.Name == schemaStr && len(entityStr) == 0 && len(attrStr) == 0 {
			focus.Schema = schema
			break
		}
		for _, entity := range schema.Entities {
			if entity.Name != entityStr {
				continue
			}
			if entity.Name == entityStr && len(attrStr) == 0 {
				focus.Entity = entity
				break
			}
			for _, attr := range entity.RawAttributes {
				if attr.Name == attrStr {
					focus.Attribute = attr
					break
				}
			}
		}
	}
}

// Output is for template rendering to show what was generated
type Output struct {
	Schemas        []*model.Schema
	GoGen          map[strgen.FileName]string
	PgGen          map[strgen.FileName]string
	OkayToDownload bool
	HasErr         bool
}

// Example is preset to show functionality
type Example struct {
	Label string
	Value string
}

func defaultExamples() []Example {
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

func output(input *Input) (*Output, error) {
	schemas := strparse.Raw(input.Q)
	goGen, err := strgen.GoStructs(schemas)
	if err != nil {
		return nil, err
	}

	var hasErr bool
	for _, s := range schemas {
		if s.HasErr() {
			hasErr = true
			break
		}
	}

	pgGen, err := strgen.PostgresSetup(schemas)
	if err != nil {
		return nil, err
	}

	return &Output{
		Schemas:        schemas,
		GoGen:          goGen,
		PgGen:          pgGen,
		HasErr:         hasErr,
		OkayToDownload: len(schemas) > 0 && !hasErr,
	}, nil
}

// TemplateData is the structure used for most templates
type TemplateData struct {
	Client   *Client
	Output   *Output
	Examples []Example
}

func (client *Client) templateData() (*TemplateData, error) {
	out, err := output(&client.Input)
	if err != nil {
		return nil, err
	}

	client.Input.Focus.SetFocus(out.Schemas)

	return &TemplateData{
		Client:   client,
		Output:   out,
		Examples: defaultExamples(),
	}, nil
}
