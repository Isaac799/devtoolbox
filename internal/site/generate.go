package site

import (
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

// SetFocus sets the focus based on its path, given schemas.
func (client *Client) SetFocus() {
	client.Input.Focus.Schema = nil
	client.Input.Focus.Entity = nil
	client.Input.Focus.Attribute = nil

	if len(client.Input.Focus.RawID) == 0 {
		return
	}

	schemas := client.LastOutput.Schemas

	// index gives direct access, instead of copy

	for si := range schemas {
		if schemas[si].ID == client.Input.Focus.RawID {
			client.Input.Focus.Schema = &schemas[si]
			break
		}
		for ei := range schemas[si].Entities {
			if schemas[si].Entities[ei].ID == client.Input.Focus.RawID {
				// schemas[si].Entities[ei].ClearCache()
				client.Input.Focus.Entity = &schemas[si].Entities[ei]
				break
			}
			for i := range schemas[si].Entities[ei].RawAttributes {
				if schemas[si].Entities[ei].RawAttributes[i].ID == client.Input.Focus.RawID {
					// schemas[si].Entities[ei].ClearCache()
					client.Input.Focus.Attribute = &schemas[si].Entities[ei].RawAttributes[i]
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

func emptyLastOutput(schemas []*model.Schema) *Output {
	return &Output{
		Schemas: schemas,
		GoGen:   make(map[strgen.FileName]string),
		PgGen:   make(map[strgen.FileName]string, 0),
	}
}

// SetOutput sets the output.
// If running in text mode, we parse out.
// If running in gui mode, we just use the last parse.
func (client *Client) SetOutput() error {
	schemas := make([]*model.Schema, 0)

	if client.LastOutput == nil {
		client.LastOutput = emptyLastOutput(schemas)
	}

	if client.Input.Mode == InputModeText {
		schemas = strparse.Raw(client.Input.Q)
	} else {
		schemas = client.LastOutput.Schemas
	}

	pgFiles, err := strgen.PostgresSetup(schemas)
	if err != nil {
		client.LastOutput = emptyLastOutput(schemas)
		return err
	}

	goFiles, err := strgen.GoStructs(schemas)
	if err != nil {
		client.LastOutput = emptyLastOutput(schemas)
		return err
	}

	var hasErr bool
	for _, s := range client.LastOutput.Schemas {
		if s.HasErr() {
			hasErr = true
			break
		}
	}

	out := Output{
		Schemas:        schemas,
		HasErr:         hasErr,
		OkayToDownload: len(client.LastOutput.Schemas) > 0 && !hasErr,
		GoGen:          goFiles,
		PgGen:          pgFiles,
	}

	client.LastOutput = &out

	return nil
}

// TemplateData is the structure used for most templates
type TemplateData struct {
	Client   *Client
	Examples []Example
}

func (client *Client) templateData() (*TemplateData, error) {
	return &TemplateData{
		Client:   client,
		Examples: defaultExamples(),
	}, nil
}
