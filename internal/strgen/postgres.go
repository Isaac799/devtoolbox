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

func renderErrs(attr *model.Attribute) string {
	return fmt.Sprintf("-- %s has errors: %s", attr.Name(), attr.Attribute.ErrString())
}

func renderKind(attr *model.Attribute) string {
	k := attr.Attribute.Kind

	if k == model.AttrKindSerial && !attr.DirectChild {
		k = model.AttrKindInt
	}

	s := _postgresKind[k]
	if k == model.AttrKindString {
		s = fmt.Sprintf("%s(%d)", s, int(attr.Attribute.Max.Float64))
	}

	if !attr.DirectChild {
		if attr.ChangedSchema {
			s = fmt.Sprintf("%s REFERENCES %s.%s(%s)", s, attr.Final.Parent.Parent.Name, attr.Final.Parent.Name, attr.Final.Name)
		} else {
			s = fmt.Sprintf("%s REFERENCES %s(%s)", s, attr.Final.Parent.Name, attr.Final.Name)
		}
	}

	return s
}

func renderDefault(attr *model.Attribute) string {
	s := attr.Attribute.DefaultValue
	if len(s) == 0 {
		return ""
	}

	switch attr.Attribute.Kind {
	case model.AttrKindString:
		escaped := strings.ReplaceAll(s, "'", "''")
		return fmt.Sprintf("'%s'", escaped)
	case model.AttrKindChar:
		return fmt.Sprintf("'%s'", s)
	case model.AttrKindDate:
		if s == "now" {
			return "current_date"
		}
		return fmt.Sprintf("'%s'", s)
	case model.AttrKindTime:
		if s == "now" {
			return "current_time"
		}
		return fmt.Sprintf("'%s'", s)
	case model.AttrKindTimestamp:
		if s == "now" {
			return "current_timestamp"
		}
		return fmt.Sprintf("'%s'", s)
	default:
		return s
	}
}

// PostgresSetup generates a postgres create statements to setup a new database
func PostgresSetup(schemas []*model.Schema) (string, error) {
	os.Chdir("..")
	os.Chdir("..")

	var err error

	tmpl := template.Template{}

	tmpl.Funcs(template.FuncMap{
		"notLast": func(i int, arr []*model.Attribute) bool {
			return i != len(arr)-1
		},
		"renderKind":    renderKind,
		"renderDefault": renderDefault,
		"renderErrs":    renderErrs,
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
