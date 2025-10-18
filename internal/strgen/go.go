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
func GoStructs(schemas []*model.Schema) (map[string]string, error) {
	var err error

	tmpl := template.Template{}

	tmpl.Funcs(template.FuncMap{
		"notLast": func(i int, arr []*model.Attribute) bool {
			return i != len(arr)-1
		},
		"renderGoErrs": renderGoErrs,
		"renderGoKind": renderGoKind,
		"renderCamel":  renderCamelUA,
		"renderPascal": renderPascalUA,
	})

	_, err = tmpl.ParseGlob("templates/go/**")
	if err != nil {
		return nil, err
	}

	m := make(map[string]string, len(schemas))

	for _, s := range schemas {
		sb := strings.Builder{}
		err = tmpl.ExecuteTemplate(&sb, "schema.tmpl", s)
		if err != nil {
			return nil, err
		}
		m[s.Name] = sb.String()
	}

	return m, nil
}
