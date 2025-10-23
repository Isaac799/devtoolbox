package site

import (
	"net/http"
	"strconv"

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

// Input is for template rendering to help retain state
type Input struct {
	Q       string
	Example string
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

// Generated is the combined generations for template usage
// on a sardine
type Generated struct {
	Input    *Input
	Output   *Output
	Examples []Example
}

// Example is preset to show functionality
type Example struct {
	Label string
	Value string
}

func defaultExamples() []Example {
	return []Example{
		{
			Label: "Foo Bar",
			Value: `# foo 

## bar 

- id as ++
- name as str with 0..3`,
		},
	}
}

func input(r *http.Request) *Input {
	query := r.FormValue("q")
	example := r.FormValue("example")

	if len(example) > 0 {
		query = example
	}

	mode := InputModeText
	modeStr := r.FormValue("mode")
	modeInt, err := strconv.Atoi(modeStr)
	if err == nil {
		if modeInt == int(InputModeGraphical) {
			mode = InputModeGraphical
		}
	}

	return &Input{
		Q:    query,
		Mode: mode,
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

// IOData provides data for template rendering
func IOData(r *http.Request) any {
	in := input(r)
	out, err := output(in)

	if err != nil {
		out := Output{
			Schemas: make([]*model.Schema, 0),
			PgGen:   make(map[strgen.FileName]string),
			GoGen:   make(map[strgen.FileName]string),
		}

		return Generated{
			Input:    in,
			Output:   &out,
			Examples: defaultExamples(),
		}
	}

	return Generated{
		Input:    in,
		Output:   out,
		Examples: defaultExamples(),
	}
}
