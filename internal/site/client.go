package site

import (
	"crypto/rand"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/Isaac799/devtoolbox/internal/strgen"
	"github.com/Isaac799/devtoolbox/internal/strparse"
	"github.com/Isaac799/devtoolbox/pkg/model"
)

var (
	// _clientTTL is how long a client session is valid for
	// after their final action
	_clientTTL = time.Hour * 24 * 7

	// _cid is the name for the client ID cookie
	_cid = "cid"
)

// Client is my way of tracking state server side
type Client struct {
	ID   string
	CSRF string

	// mutex protects below
	mu         sync.Mutex
	Expire     time.Time
	Input      Input
	LastOutput *Output
	Dirty      uint
}

func (c *Client) extendLife() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.Expire = time.Now().Add(_clientTTL)
}

func (c *Client) setSessionCookie(w http.ResponseWriter) {
	c.extendLife()

	http.SetCookie(w, &http.Cookie{
		Name:     string(_cid),
		Value:    c.ID,
		Expires:  time.Now().Add(_clientTTL),
		SameSite: http.SameSiteLaxMode,
		HttpOnly: true,
		Path:     "/",
	})
}

func (c *Client) change(r *http.Request, changes ...change) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for _, change := range changes {
		change(r, c)
	}
}

// SetQ will set the main query string related to a client
func (c *Client) SetQ(schemas []*model.Schema) {
	sb := strings.Builder{}

	for si, schema := range schemas {
		if si > 0 {
			sb.WriteString("\n")
		}
		sb.WriteString(schema.String())
		sb.WriteString("\n")
		sb.WriteString("\n")
		for ei, entity := range schema.Entities {
			if ei > 0 {
				sb.WriteString("\n")
			}
			sb.WriteString(entity.String())
			sb.WriteString("\n")
			sb.WriteString("\n")
			for _, attr := range entity.RawAttributes {
				sb.WriteString(attr.String())
				sb.WriteString("\n")
			}
		}
	}

	c.Input.Q = sb.String()
}

func (c *Client) clearFocus() {
	c.Input.Focus.Schema = nil
	c.Input.Focus.Entity = nil
	c.Input.Focus.Attribute = nil
}

func (c *Client) setFocus() {
	c.clearFocus()

	if len(c.Input.Focus.RawID) == 0 {
		return
	}

	schemas := c.LastOutput.Schemas

	// index gives direct access, instead of copy

	for si := range schemas {
		if schemas[si].ID == c.Input.Focus.RawID {
			c.Input.Focus.Schema = &schemas[si]
			return
		}
		for ei := range schemas[si].Entities {
			if schemas[si].Entities[ei].ID == c.Input.Focus.RawID {
				// schemas[si].Entities[ei].ClearCache()
				c.Input.Focus.Entity = &schemas[si].Entities[ei]
				return
			}
			for i := range schemas[si].Entities[ei].RawAttributes {
				if schemas[si].Entities[ei].RawAttributes[i].ID == c.Input.Focus.RawID {
					// schemas[si].Entities[ei].ClearCache()
					c.Input.Focus.Attribute = &schemas[si].Entities[ei].RawAttributes[i]
					return
				}
			}
		}
	}

	// not found
	c.Input.Focus.RawID = ""
}

// SetOutput sets the output.
// If running in text mode, we parse out.
// If running in gui mode, we just use the last parse.
func (c *Client) SetOutput() error {
	schemas := make([]*model.Schema, 0)

	if c.LastOutput == nil {
		c.LastOutput = emptyLastOutput(schemas)
	}

	if len(c.Input.Example) > 0 {
		schemas = strparse.Raw(c.Input.Example)
		c.Input.Q = c.Input.Example
		c.Input.Example = ""
	} else if c.Input.Mode == InputModeText {
		schemas = strparse.Raw(c.Input.Q)
	} else {
		schemas = c.LastOutput.Schemas
	}

	switch c.Input.Mode {
	case InputModeGraphical:
		c.SetQ(schemas)
	case InputModeText:
		c.clearFocus()
	}

	pgFiles, err := strgen.PostgresSetup(schemas)
	if err != nil {
		c.LastOutput = emptyLastOutput(schemas)
		return err
	}

	goFiles, err := strgen.GoStructs(schemas)
	if err != nil {
		c.LastOutput = emptyLastOutput(schemas)
		return err
	}

	hurlFiles, err := strgen.HurlTests(schemas)
	if err != nil {
		c.LastOutput = emptyLastOutput(schemas)
		return err
	}

	var hasErr bool
	for _, s := range c.LastOutput.Schemas {
		if s.HasErr() {
			hasErr = true
			break
		}
	}

	out := Output{
		Schemas:        schemas,
		HasErr:         hasErr,
		OkayToDownload: len(schemas) > 0 && !hasErr,
		GoGen:          goFiles,
		PgGen:          pgFiles,
		HurlGen:        hurlFiles,
	}

	c.LastOutput = &out

	return nil
}

// NewClient makes a new client
func NewClient() *Client {
	return &Client{
		ID:   rand.Text(),
		CSRF: rand.Text(),
		Input: Input{
			Mode: InputModeGraphical,
			Q:    DefaultExamples()[0].Value,
		},
	}
}
