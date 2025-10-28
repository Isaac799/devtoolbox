package site

import (
	"net/http"
	"sync"

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

// ClientState is the combined generations for template usage
// on a sardine
type ClientState struct {
	mu    *sync.Mutex
	Input *Input
}

func newClientState() *ClientState {
	return &ClientState{
		mu:    &sync.Mutex{},
		Input: &Input{},
	}
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

type RenderState struct {
	Input    *Input
	Output   *Output
	Examples []Example
}

func renderState(client *Client) RenderState {
	return RenderState{
		Input:    client.State.Input,
		Output:   &Output{},
		Examples: defaultExamples(),
	}
}

// OnCatchForGenerate is the on catch fn for generating
// an output
func OnCatchForGenerate(r *http.Request) any {
	client, ok := r.Context().Value(_cid).(*Client)
	if !ok {
		return renderState(nil)
	}

	r.ParseForm()

	client.deltas(
		r,
		deltaQ, deltaMode, deltaExample,
	)

	out, err := output(client.State.Input)
	if err != nil {
		return renderState(client)
	}

	state := renderState(client)
	state.Output = out
	return state
}
