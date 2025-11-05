package site

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
)

// delta is how we change a client based on a request
type delta = func(*http.Request, *Client)

var deltaQ = delta(func(r *http.Request, c *Client) {
	const k = "q"
	_, exists := r.Form[k]
	if !exists {
		return
	}

	c.Input.Q = r.FormValue(k)
})

var deltaMode = delta(func(r *http.Request, c *Client) {
	const k = "mode"
	_, exists := r.Form[k]
	if !exists {
		return
	}

	mode := InputModeText
	modeStr := r.FormValue(k)
	modeInt, err := strconv.Atoi(modeStr)
	if err == nil {
		if modeInt == int(InputModeGraphical) {
			mode = InputModeGraphical
		}
	}

	c.Input.Mode = mode
})

var deltaExample = delta(func(r *http.Request, c *Client) {
	const k = "example"
	_, exists := r.Form[k]
	if !exists {
		return
	}

	c.Input.Q = r.FormValue(k)
})

var deltaFocus = delta(func(r *http.Request, c *Client) {
	const k = "focus"
	_, exists := r.Form[k]
	if !exists {
		return
	}

	c.Input.Focus.RawID = r.FormValue(k)
	c.SetFocus()
})

// SetQ will set the main query string related to a client
func (client *Client) SetQ(schemas []*model.Schema) {
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

	client.Input.Q = sb.String()
}

var deltaSchema = delta(func(r *http.Request, c *Client) {
	c.SetFocus()
	if c.Input.Focus.Schema == nil {
		return
	}

	sch := makeSchema(r)
	oldSch := *c.Input.Focus.Schema

	sch.ID = oldSch.ID

	*c.Input.Focus.Schema = sch
})

var deltaEntity = delta(func(r *http.Request, c *Client) {
	c.SetFocus()
	if c.Input.Focus.Entity == nil {
		return
	}

	ent := makeEntity(r)
	oldEnt := *c.Input.Focus.Entity

	ent.ID = oldEnt.ID

	ent.ClearCache()

	*c.Input.Focus.Entity = ent
})

var deltaAttribute = delta(func(r *http.Request, c *Client) {
	c.SetFocus()
	if c.Input.Focus.Attribute == nil {
		return
	}

	oldAttr := *c.Input.Focus.Attribute
	attr := makeAttribute(r)

	attr.ID = oldAttr.ID
	attr.Parent = oldAttr.Parent
	attr.ReferenceTo = oldAttr.ReferenceTo

	if attr.Kind == model.AttrKindReference {
		attr.EnsureValidReference(c.LastOutput.Schemas)
	}

	attr.EnsureValidAlias(oldAttr.Parent)
	attr.EnsureValidRange()
	attr.MaybeRequireValidation()
	attr.SanitizeDefaultValue()
	attr.SanativeSerialKind()

	attr.Parent.ClearCache()

	*c.Input.Focus.Attribute = attr
})
