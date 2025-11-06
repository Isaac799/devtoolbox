package site

import (
	"crypto/rand"
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/Isaac799/devtoolbox/internal/strparse"
	"github.com/Isaac799/devtoolbox/pkg/model"
)

// Make is the handler to make a new schema, entity, or attribute
func Make(w http.ResponseWriter, r *http.Request) {
	switch r.PathValue("what") {
	case "schema":
		schema := makeSchema(r)
		w.Write([]byte(schema.String()))
	case "entity":
		entity := makeEntity(r)
		w.Write([]byte(entity.String()))
	case "attribute":
		attribute := makeAttribute(r)
		w.Write([]byte(attribute.String()))
	default:
		w.WriteHeader(http.StatusBadRequest)
	}
}

func makeSchema(r *http.Request) *model.Schema {
	return &model.Schema{
		ID:   r.FormValue("SchemaID"),
		Name: r.FormValue("SchemaName"),
	}
}

func makeEntity(r *http.Request) *model.Entity {
	return &model.Entity{
		ID:   r.FormValue("EntityID"),
		Name: r.FormValue("EntityName"),
	}
}

func makeAttribute(r *http.Request) *model.AttributeRaw {
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
		fallbackName = strparse.Normalize("unset " + rand.Text()[:4])
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
		attributeName = strparse.Normalize(attributeName)
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
		Alias:        strparse.Normalize(attributeAlias),
		DefaultValue: strings.TrimSpace(attributeDefault),
		Unique:       cleanUniqueLabels,
		Err:          []error{},
	}

	return &raw
}
