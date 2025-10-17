package strparse

import (
	"regexp"
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
	"github.com/iancoleman/strcase"
)

func determineLineKind(s string) LineKind {
	kind := LineKindNone
	if strings.HasPrefix(s, PrefixSch) {
		kind = LineKindSch
	} else if strings.HasPrefix(s, PrefixTbl) {
		kind = LineKindTbl
	} else if strings.HasPrefix(s, PrefixAttr) {
		kind = LineKindAttr
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
			if matched, _ := regexp.Match(RegDigit.String(), []byte(string(r))); matched {
				continue
			}
		}
		// word chars (snake) only
		if matched, _ := regexp.Match(RegWordChar.String(), []byte(string(r))); !matched {
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
	var prevTbl *model.Entity

	lines := strings.SplitSeq(s, "\n")
	for lineRaw := range lines {
		line := strings.TrimSpace(lineRaw)
		lineKind := determineLineKind(line)

		switch lineKind {
		case LineKindSch:
			sch, err := newSchFromLine(line)
			if err != nil {
				continue
			}
			prevSch = sch
			schemas = append(schemas, sch)
		case LineKindTbl:
			if prevSch == nil {
				continue
			}
			tbl, err := newTblFromLine(line)
			if err != nil {
				continue
			}
			prevTbl = tbl
			prevSch.Entities = append(prevSch.Entities, tbl)
		case LineKindAttr:
			if prevTbl == nil {
				continue
			}
			attr := newAttributeFromLine(line)
			prevTbl.Attributes = append(prevTbl.Attributes, attr)
		default:
			continue
		}
	}

	return schemas
}
