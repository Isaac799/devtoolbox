package strgen

import (
	"fmt"
	"strconv"
	"strings"
	"text/template"

	"github.com/Isaac799/devtoolbox/pkg/model"
)

var _postgresKind = map[model.AttrKind]string{
	model.AttrKindNone:      "???",
	model.AttrKindReference: "REF",
	model.AttrKindSerial:    "SERIAL",
	model.AttrKindInt:       "INT",
	model.AttrKindChar:      "CHARACTER",
	model.AttrKindString:    "VARCHAR",
	model.AttrKindBit:       "BIT",
	model.AttrKindBoolean:   "BOOLEAN",
	model.AttrKindDate:      "DATE",
	model.AttrKindTime:      "TIME",
	model.AttrKindTimestamp: "TIMESTAMP",
	model.AttrKindFloat:     "FLOAT",
	model.AttrKindReal:      "REAL",
	model.AttrKindDecimal:   "DECIMAL",
	model.AttrKindMoney:     "MONEY",
}

func renderErrs(attr *model.Attribute) string {
	return fmt.Sprintf("-- %s has errors: %s", attr.Name(), attr.Attribute.ErrString())
}

func renderIsNotNull(attr *model.Attribute) bool {
	if attr.Source.Kind == model.AttrKindSerial {
		return false
	}
	return attr.Source.Required.Valid && attr.Source.Required.Bool
}

func renderKind(attr *model.Attribute) string {
	k := attr.Final.Kind

	if k == model.AttrKindSerial && !attr.DirectChild {
		k = model.AttrKindInt
	}

	s := _postgresKind[k]

	switch k {
	case model.AttrKindString, model.AttrKindChar, model.AttrKindBit:
		i, _ := strconv.Atoi(attr.Final.Max.String)
		if i > 0 {
			s = fmt.Sprintf("%s(%d)", s, i)
		}
	}
	return s
}

func renderReference(attr *model.Attribute) string {
	if attr.DirectChild {
		// unreachable
		return "???"
	}

	if attr.ChangedSchema {
		return fmt.Sprintf("%s.%s(%s)", attr.Final.Parent.Parent.Name, attr.Final.Parent.Name, attr.Final.Name)
	}
	return fmt.Sprintf("%s(%s)", attr.Final.Parent.Name, attr.Final.Name)
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
func PostgresSetup(schemas []*model.Schema) (map[FileName]string, error) {
	var err error

	tmpl := template.Template{}

	tmpl.Funcs(template.FuncMap{
		"notLast": func(i int, arr []*model.Attribute) bool {
			return i != len(arr)-1
		},
		"renderKind":      renderKind,
		"renderDefault":   renderDefault,
		"renderErrs":      renderErrs,
		"renderReference": renderReference,
		"renderIsNotNull": renderIsNotNull,
	})

	m := make(map[FileName]string, len(schemas))
	{
		_, err = tmpl.ParseGlob("templates/postgres/tables/**")
		if err != nil {
			return nil, err
		}
		sb := strings.Builder{}
		err = tmpl.ExecuteTemplate(&sb, "root.tmpl", schemas)
		if err != nil {
			return nil, err
		}

		s := sb.String()

		if len(s) > 0 {
			m[newFileName("postgres", "tables.sql")] = s
		}
	}
	return m, nil
}
