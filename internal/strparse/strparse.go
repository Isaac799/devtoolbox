package strparse

import (
	"fmt"
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
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
			attr, err := newAttributeFromLine(line)
			if err != nil {
				fmt.Println(err.Error(), line)
				continue
			}
			prevTbl.Attributes = append(prevTbl.Attributes, attr)
		default:
			continue
		}
	}

	return schemas
}
