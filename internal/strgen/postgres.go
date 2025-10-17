package strgen

import (
	"fmt"
	"os"
	"strings"
	"text/template"

	"github.com/Isaac799/devtoolbox/pkg/model"
)

var _postgresKind = map[model.AttrKind]string{
	model.AttrKindNone:      "???",
	model.AttrKindBit:       "BIT",
	model.AttrKindDate:      "DATE",
	model.AttrKindChar:      "CHARACTER",
	model.AttrKindTime:      "TIME",
	model.AttrKindTimestamp: "TIMESTAMP",
	model.AttrKindDecimal:   "DECIMAL",
	model.AttrKindReal:      "REAL",
	model.AttrKindFloat:     "FLOAT",
	model.AttrKindSerial:    "SERIAL",
	model.AttrKindInt:       "INT",
	model.AttrKindBoolean:   "BOOLEAN",
	model.AttrKindString:    "VARCHAR",
	model.AttrKindMoney:     "MONEY",
	model.AttrKindReference: "REF",
}

// PostgresSetupTemplate generates a postgres create statements to setup a new database
func PostgresSetup(schemas []*model.Schema) (string, error) {
	os.Chdir("..")
	os.Chdir("..")

	var err error

	tmpl := template.Template{}

	tmpl.Funcs(template.FuncMap{
		"notLast": func(i int, arr []*model.Attribute) bool {
			return i != len(arr)-1
		},
		"attrKind": func(attr model.Attribute) string {
			s := _postgresKind[attr.Kind]
			if attr.Kind == model.AttrKindString {
				s = fmt.Sprintf("%s(%d)", s, int(attr.Max.Float64))
			}
			return s
		},
	})

	_, err = tmpl.ParseGlob("templates/postgres/**")
	if err != nil {
		return "", err
	}

	sb := strings.Builder{}
	err = tmpl.ExecuteTemplate(&sb, "root.tmpl", schemas)
	if err != nil {
		return "", err
	}
	return sb.String(), nil
}
