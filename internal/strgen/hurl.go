package strgen

import (
	"fmt"
	"strings"
	"text/template"

	"github.com/Isaac799/devtoolbox/pkg/model"
	"github.com/iancoleman/strcase"
)

var _hurlSeedValue = map[model.AttrKind]string{
	model.AttrKindNone:      "???",
	model.AttrKindReference: "???",
	model.AttrKindSerial:    "2",
	model.AttrKindInt:       "1",
	model.AttrKindChar:      "'a'",
	model.AttrKindString:    `"foo"`,
	model.AttrKindBit:       `"00000100"`,
	model.AttrKindBoolean:   "false",
	model.AttrKindDate:      "\"2025-11-08T21:24:52Z\"",
	model.AttrKindTime:      "\"2025-11-08T21:24:52Z\"",
	model.AttrKindTimestamp: "\"2025-11-08T21:24:52Z\"",
	model.AttrKindFloat:     "1.2",
	model.AttrKindReal:      "1.2",
	model.AttrKindDecimal:   "1.2",
	model.AttrKindMoney:     "1.2",
}

func renderSeedValue(attr *model.Attribute) string {
	k := attr.Final.Kind

	if k == model.AttrKindSerial && !attr.DirectChild {
		k = model.AttrKindInt
	}

	s := _hurlSeedValue[k]
	return s
}

func renderHurlPathValues(ent *model.Entity) string {
	parts := []string{}
	primaries := ent.Primary()

	if len(primaries) > 1 {
		for _, attr := range primaries {
			if attr.Final.Parent.CompositePrimary() {
				s := fmt.Sprintf("%s/{{%s}}", strcase.ToKebab(attr.Name()), attr.Name())
				parts = append(parts, s)
				continue
			}

			// if not composite we can remove redundant pattern to improve clarity
			// 'foo-id/{foo_id}' -> '/foo/{foo_id}'
			redundantSuffix := fmt.Sprintf("-%s", attr.Final.Name)
			s2, _ := strings.CutSuffix(strcase.ToKebab(attr.Name()), redundantSuffix)
			s := fmt.Sprintf("%s/{{%s}}", s2, attr.Name())
			parts = append(parts, s)
		}
	} else {
		for _, attr := range primaries {
			s := fmt.Sprintf("{{%s}}", strcase.ToSnake(attr.Name()))
			parts = append(parts, s)
		}
	}
	return strings.Join(parts, "/")
}

// HurlTests generates hurl tests
func HurlTests(schemas []*model.Schema) (map[FileName]string, error) {
	var err error

	var rootTmpl = func() template.Template {
		tmpl := template.Template{}

		tmpl.Funcs(template.FuncMap{
			"renderHurlPathValues": renderHurlPathValues,
			"renderKebab":          renderKebab,
			"renderSeedValue":      renderSeedValue,
			"notLast": func(i int, arr []*model.Attribute) bool {
				return i != len(arr)-1
			},
		})
		return tmpl
	}

	m := make(map[FileName]string, len(schemas))

	for _, s := range schemas {
		tmpl := rootTmpl()
		_, err = tmpl.ParseGlob("templates/hurl/**.tmpl")
		if err != nil {
			return nil, err
		}
		for _, ent := range s.Entities {
			sb := strings.Builder{}
			err = tmpl.ExecuteTemplate(&sb, "root.tmpl", ent)
			if err != nil {
				return nil, err
			}
			pn := packageName(s.Name)
			m[newFileName(pn, fmt.Sprintf("%s.hurl", ent.Name))] = sb.String()
		}
	}

	return m, nil
}
