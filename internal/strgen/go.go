package strgen

import (
	"fmt"
	"strings"
	"text/template"

	"github.com/Isaac799/devtoolbox/pkg/model"
	"github.com/iancoleman/strcase"
)

var _goKind = map[model.AttrKind]string{
	model.AttrKindNone:      "???",
	model.AttrKindBit:       "bool",
	model.AttrKindDate:      "time.Time",
	model.AttrKindChar:      "rune",
	model.AttrKindTime:      "time.Time",
	model.AttrKindTimestamp: "time.Time",
	model.AttrKindDecimal:   "float64",
	model.AttrKindReal:      "float64",
	model.AttrKindFloat:     "float64",
	model.AttrKindSerial:    "int",
	model.AttrKindInt:       "int",
	model.AttrKindBoolean:   "bool",
	model.AttrKindString:    "string",
	model.AttrKindMoney:     "float64",
	model.AttrKindReference: "???",
}

func renderGoErrs(attr *model.Attribute) string {
	return fmt.Sprintf("// %s has errors: %s", attr.Name(), attr.Attribute.ErrString())
}

func renderPlusOne(i int) int {
	return i + 1
}

// renderPlusOneOverAttrs helps with postgres string query templating
// on the where clause not overlapping with what is being set
func renderPlusOneOverAttrs(ent *model.Entity, i int) int {
	return i + 1 + len(ent.NonPrimary())
}

func renderHandlerName(ent *model.Entity) string {
	return strcase.ToCamel(fmt.Sprintf("%s_handler", ent.Name))
}

func renderStoreName(ent *model.Entity) string {
	return strcase.ToCamel(fmt.Sprintf("%s_store", ent.Name))
}

func renderPathValues(ent *model.Entity) string {
	parts := []string{}
	for _, attr := range ent.Primary() {
		s := fmt.Sprintf("{%s}", strcase.ToKebab(attr.Name()))
		parts = append(parts, s)
	}
	return strings.Join(parts, "/")
}

func renderGoKind(attr *model.Attribute) string {
	k := attr.Final.Kind

	if k == model.AttrKindSerial && !attr.DirectChild {
		k = model.AttrKindInt
	}

	s := _goKind[k]
	return s
}

func packageName(s string) string {
	s = strcase.ToSnake(s)
	return strings.ReplaceAll(s, "_", "")
}

// GoStructs generates golang structs
func GoStructs(schemas []*model.Schema) (map[FileName]string, error) {
	var err error

	var rootTmpl = func() template.Template {
		tmpl := template.Template{}

		tmpl.Funcs(template.FuncMap{
			"notLast": func(i int, arr []*model.Attribute) bool {
				return i != len(arr)-1
			},
			"renderCamel":  renderCamelUA,
			"renderPascal": renderPascalUA,
			"renderKebab":  renderKebab,

			"renderGoErrs": renderGoErrs,
			"renderGoKind": renderGoKind,

			"renderPlusOne":          renderPlusOne,
			"renderPlusOneOverAttrs": renderPlusOneOverAttrs,

			"renderStoreName":   renderStoreName,
			"renderHandlerName": renderHandlerName,
			"renderPathValues":  renderPathValues,
		})
		return tmpl
	}

	m := make(map[FileName]string, len(schemas))

	for _, s := range schemas {
		tmpl := rootTmpl()
		_, err = tmpl.ParseGlob("templates/go/struct/**.tmpl")
		if err != nil {
			return nil, err
		}

		sb := strings.Builder{}
		err = tmpl.ExecuteTemplate(&sb, "schema.tmpl", s)
		if err != nil {
			return nil, err
		}
		pn := packageName(s.Name)
		m[newFileName(pn, fmt.Sprintf("%s.go", pn))] = sb.String()
	}

	for _, s := range schemas {
		tmpl := rootTmpl()
		_, err = tmpl.ParseGlob("templates/go/store/**.tmpl")
		if err != nil {
			return nil, err
		}

		sb := strings.Builder{}
		err = tmpl.ExecuteTemplate(&sb, "root.tmpl", s)
		if err != nil {
			return nil, err
		}
		m[newFileName(packageName(s.Name), "store.go")] = sb.String()
	}

	for _, s := range schemas {
		tmpl := rootTmpl()
		_, err = tmpl.ParseGlob("templates/go/handler/**.tmpl")
		if err != nil {
			return nil, err
		}

		sb := strings.Builder{}
		err = tmpl.ExecuteTemplate(&sb, "root.tmpl", s)
		if err != nil {
			return nil, err
		}
		m[newFileName(packageName(s.Name), "handler.go")] = sb.String()
	}

	return m, nil
}
