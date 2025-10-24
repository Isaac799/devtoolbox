package site

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
)

// Make is the handler to make a new schema, entity, or attribute
func Make(w http.ResponseWriter, r *http.Request) {
	switch r.PathValue("what") {
	case "schema":
		schema := model.Schema{
			Name: r.FormValue("SchemaName"),
		}
		w.Write([]byte(schema.String()))
	case "entity":
		entity := model.Entity{
			Name: r.FormValue("EntityName"),
		}
		w.Write([]byte(entity.String()))
	case "attribute":
		attributeName := r.FormValue("AttributeName")
		attributeKindStr := r.FormValue("AttributeKind")
		attributeKind, _ := strconv.Atoi(attributeKindStr)

		attributeMin := r.FormValue("AttributeMin")
		attributeMax := r.FormValue("AttributeMax")
		attributeRequired := r.FormValue("AttributeRequired")
		attributePrimary := r.FormValue("AttributePrimary")
		attributeUnique := r.FormValue("AttributeUnique")
		attributeDefault := r.FormValue("AttributeDefault")
		attributeReferenceTo := r.FormValue("AttributeReferenceTo")
		attributeAlias := r.FormValue("AttributeAlias")

		var refTo *model.Entity

		if len(attributeReferenceTo) > 0 {
			refTo = &model.Entity{
				Name: attributeReferenceTo,
			}
		}

		attr := model.AttributeRaw{
			Name: attributeName,
			Kind: model.AttrKind(attributeKind),
			Validation: model.Validation{
				Min:      sql.NullString{String: attributeMin},
				Max:      sql.NullString{String: attributeMax},
				Required: sql.NullBool{Bool: attributeRequired == "true"},
			},
			Primary:      attributePrimary == "true",
			Alias:        attributeAlias,
			DefaultValue: attributeDefault,
			Unique:       strings.Split(attributeUnique, ","),
			Err:          []error{},
			ReferenceTo:  refTo,
		}
		w.Write([]byte(attr.String()))
	default:
		w.WriteHeader(http.StatusBadRequest)
	}
}
