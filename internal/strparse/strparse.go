package strparse

import (
	"crypto/rand"
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
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
			if len(sch.ID) == 0 {
				sch.ID = rand.Text()
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
			if len(ent.ID) == 0 {
				ent.ID = rand.Text()
			}
			ent.Parent = prevSch
			prevEnt = ent
			prevSch.Entities = append(prevSch.Entities, ent)
		case lineKindAttr:
			if prevEnt == nil {
				continue
			}
			attr := newAttributeFromLine(line)
			if len(attr.ID) == 0 {
				attr.ID = rand.Text()
			}
			attr.Parent = prevEnt

			if attr.Kind == model.AttrKindReference {
				attr.EnsureValidReference(schemas)
			}

			attr.EnsureValidAlias(prevEnt)
			attr.EnsureValidName(prevEnt)
			attr.EnsureValidRange()
			attr.MaybeRequireValidation()
			attr.SanitizeDefaultValue()
			attr.SanativeSerialKind()

			prevEnt.RawAttributes = append(prevEnt.RawAttributes, attr)
		default:
			continue
		}
	}

	return schemas
}
