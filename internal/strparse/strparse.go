package strparse

import (
	"regexp"
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
	"github.com/iancoleman/strcase"
)

func determineLineKind(s string) lineKind {
	kind := lineKindNone
	if strings.HasPrefix(s, prefixSch) {
		kind = lineKindSch
	} else if strings.HasPrefix(s, prefixEnt) {
		kind = lineKindEnt
	} else if strings.HasPrefix(s, prefixAttr) {
		kind = lineKindAttr
	}
	return kind
}

func normalize(s string) string {
	s = strings.ToLower(strcase.ToSnake(s))

	ok := make([]rune, 0, len(s))
	var prev rune

	for i, r := range s {
		if len(ok) == 0 && r == '_' {
			continue
		}

		if r == '_' && prev == '_' {
			continue
		}

		// no digit first char
		if i == 0 {
			if matched, _ := regexp.Match(regDigit.String(), []byte(string(r))); matched {
				continue
			}
		}
		// word chars (snake) only
		if matched, _ := regexp.Match(regWordChar.String(), []byte(string(r))); !matched {
			continue
		}

		ok = append(ok, r)
		prev = r
	}

	return string(ok)
}

// Raw takes in a string and provides the schemas
func Raw(s string) []*model.Schema {
	schemas := make([]*model.Schema, 0, 3)

	var prevSch *model.Schema
	var prevEnt *model.Entity

	lines := strings.SplitSeq(s, "\n")
	for lineRaw := range lines {
		line := strings.TrimSpace(lineRaw)
		lineKind := determineLineKind(line)

		switch lineKind {
		case lineKindSch:
			sch, err := newSchFromLine(line)
			if err != nil {
				continue
			}
			prevSch = sch
			schemas = append(schemas, sch)
		case lineKindEnt:
			if prevSch == nil {
				continue
			}
			ent, err := newEntFromLine(line)
			if err != nil {
				continue
			}
			ent.Parent = prevSch
			prevEnt = ent
			prevSch.Entities = append(prevSch.Entities, ent)
		case lineKindAttr:
			if prevEnt == nil {
				continue
			}
			attr := newAttributeFromLine(line)
			attr.Parent = prevEnt
			prevEnt.Attributes = append(prevEnt.Attributes, attr)
		default:
			continue
		}
	}

	return schemas
}
