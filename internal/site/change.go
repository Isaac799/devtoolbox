package site

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/Isaac799/devtoolbox/internal"
	"github.com/Isaac799/devtoolbox/pkg/model"
)

// masks of client state changes to help inform what parts of the ui need to be re-rendered
const (
	MaskDirtyQ = 1 << iota
	MaskDirtyMode
	MaskDirtyExample
	MaskDirtyFocus
)

// change is how we change a client based on a request
type change = func(*http.Request, *Client)

var changeQ = change(func(r *http.Request, c *Client) {
	const k = "q"
	_, exists := r.Form[k]
	if !exists {
		return
	}

	c.Dirty = c.Dirty | MaskDirtyQ
	c.Input.Q = r.FormValue(k)
})

var changeMode = change(func(r *http.Request, c *Client) {
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

	c.Dirty = c.Dirty | MaskDirtyMode
	c.Input.Mode = mode
})

var changeExample = change(func(r *http.Request, c *Client) {
	const k = "example"
	_, exists := r.Form[k]
	if !exists {
		return
	}

	c.Dirty = c.Dirty | MaskDirtyExample
	c.Input.Example = r.FormValue(k)
})

var changeFocus = change(func(r *http.Request, c *Client) {
	const k = "focus"
	_, exists := r.Form[k]
	if !exists {
		return
	}

	s := r.FormValue(k)
	if len(s) == 0 {
		return
	}

	c.Dirty = c.Dirty | MaskDirtyFocus
	c.Input.Focus.RawID = s
	c.setFocus()
})

func newSchemaFromRequest(r *http.Request) *model.Schema {
	return &model.Schema{
		ID:   r.FormValue("SchemaID"),
		Name: r.FormValue("SchemaName"),
	}
}

func newEntityFromRequest(r *http.Request) *model.Entity {
	return &model.Entity{
		ID:   r.FormValue("EntityID"),
		Name: r.FormValue("EntityName"),
	}
}

func newAttributeFromRequest(r *http.Request) *model.AttributeRaw {
	var (
		id                   = r.FormValue("AttributeID")
		attributeName        = r.FormValue("AttributeName")
		attributeKindStr     = r.FormValue("AttributeKind")
		attributeKind, _     = strconv.Atoi(attributeKindStr)
		attributeMin         = r.FormValue("AttributeMin")
		attributeMax         = r.FormValue("AttributeMax")
		attributeRequired    = r.FormValue("AttributeRequired")
		attributePrimary     = r.FormValue("AttributePrimary")
		attributeUnique      = r.FormValue("AttributeUnique")
		attributeDefault     = r.FormValue("AttributeDefault")
		attributeReferenceTo = r.FormValue("AttributeReferenceTo")
		attributeAlias       = r.FormValue("AttributeAlias")
	)

	if attributeKind > 14 || attributeKind < 0 {
		attributeKind = 0
	}

	var (
		fallbackName = internal.NewFallbackName()
		kind         = model.AttrKind(attributeKind)
	)

	if kind == model.AttrKindReference {
		if len(attributeReferenceTo) > 0 {
			// setting ID as the attr name
			attributeName = attributeReferenceTo
		} else {
			attributeName = fallbackName
		}
	} else {
		attributeName = internal.Normalize(attributeName)
	}

	if len(attributeName) == 0 {
		attributeName = fallbackName
	}

	rawUniqueLabels := strings.Split(attributeUnique, ",")
	cleanUniqueLabels := make([]string, 0, len(rawUniqueLabels))
	for _, s := range rawUniqueLabels {
		s2 := strings.TrimSpace(s)
		if len(s2) == 0 {
			continue
		}
		cleanUniqueLabels = append(cleanUniqueLabels, s2)
	}

	raw := model.AttributeRaw{
		ID:   id,
		Name: attributeName,
		Kind: kind,
		Validation: model.Validation{
			Min:      sql.NullString{String: attributeMin, Valid: len(attributeMin) > 0},
			Max:      sql.NullString{String: attributeMax, Valid: len(attributeMax) > 0},
			Required: sql.NullBool{Bool: attributeRequired == "true", Valid: len(attributeRequired) > 0},
		},
		Primary:      attributePrimary == "true",
		Alias:        internal.Normalize(attributeAlias),
		DefaultValue: strings.TrimSpace(attributeDefault),
		Unique:       cleanUniqueLabels,
		Err:          []error{},
	}

	return &raw
}

var changeSchema = change(func(r *http.Request, c *Client) {
	if c.Input.Focus.Schema == nil {
		return
	}

	sch := newSchemaFromRequest(r)
	oldSch := *c.Input.Focus.Schema

	sch.ID = oldSch.ID

	*c.Input.Focus.Schema = sch
})

var changeEntity = change(func(r *http.Request, c *Client) {
	if c.Input.Focus.Entity == nil {
		return
	}

	ent := newEntityFromRequest(r)
	oldEnt := *c.Input.Focus.Entity

	ent.ID = oldEnt.ID

	ent.ClearCache()

	*c.Input.Focus.Entity = ent
})

var changeAttribute = change(func(r *http.Request, c *Client) {
	if c.Input.Focus.Attribute == nil {
		return
	}

	oldAttr := *c.Input.Focus.Attribute
	attr := newAttributeFromRequest(r)

	attr.ID = oldAttr.ID
	attr.Parent = oldAttr.Parent

	if attr.Kind == model.AttrKindReference {
		attr.EnsureValidReference(c.LastOutput.Schemas)
	}

	attr.EnsureValidAlias(oldAttr.Parent)
	attr.EnsureValidName(oldAttr.Parent)
	attr.EnsureValidRange()
	attr.MaybeRequireValidation()
	attr.SanitizeDefaultValue()
	attr.SanativeSerialKind()

	attr.Parent.ClearCache()

	*c.Input.Focus.Attribute = attr
})
