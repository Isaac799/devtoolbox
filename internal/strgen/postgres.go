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

// PostgresSetup generates a postgres create statements to setup a new database
func PostgresSetup(schemas []*model.Schema) string {
	sb := strings.Builder{}
	for schI, sch := range schemas {
		if schI > 0 {
			fmt.Fprintf(&sb, "\n")
		}
		fmt.Fprintf(&sb, "CREATE SCHEMA %s;", sch.Name)
		for _, ent := range sch.Entities {
			fmt.Fprintf(&sb, "\n")
			fmt.Fprintf(&sb, "CREATE TABLE %s (", ent.Name)

			for attrI, attr := range ent.Attributes {
				if attrI > 0 {
					fmt.Fprintf(&sb, ",\n")
				} else {
					fmt.Fprintf(&sb, "\n")
				}
				if attr.Err != nil {
					fmt.Fprintf(&sb, "\t-- %v (", attr.Err)
					continue
				}

				if attr.Kind == model.AttrKindString {
					fmt.Fprintf(&sb, "\t%s %s(%d)", attr.Name, _postgresKind[attr.Kind], int(attr.Max.Float64))
				} else {
					fmt.Fprintf(&sb, "\t%s %s", attr.Name, _postgresKind[attr.Kind])
				}
			}

			prim := ent.PrimaryList()
			if len(prim) > 0 {
				fmt.Fprintf(&sb, ",\n\tPRIMARY KEY (%s)", strings.Join(prim, ","))
			}
			fmt.Fprintf(&sb, "\n);")
		}
	}

	return sb.String()
}

// PostgresSetupTemplate generates a postgres create statements to setup a new database
func PostgresSetupTemplate(schemas []*model.Schema) (string, error) {
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
