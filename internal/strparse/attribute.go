package strparse

import (
	"database/sql"
	"fmt"
	"slices"
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
	"github.com/iancoleman/strcase"
)

func newAttributeFromLine(s string) *model.AttributeRaw {
	var (
		noPrefix = strings.TrimPrefix(s, prefixAttr)
	)

	var alias string

	_afterRefShortHand, found := strings.CutPrefix(noPrefix, "@")
	if found {
		if !strings.Contains(noPrefix, deliAs) {
			kindStr, optsStr, _ := strings.Cut(_afterRefShortHand, deliWith)
			noPrefix = fmt.Sprintf("%s as reference with %s", kindStr, optsStr)
		} else {
			identifierStr, after, _ := strings.Cut(_afterRefShortHand, deliAs)
			kindStr, optsStr, _ := strings.Cut(after, deliWith)
			alias = strings.TrimSpace(kindStr)
			noPrefix = fmt.Sprintf("%s as reference with %s", identifierStr, optsStr)
		}
	}

	identifierStr, _later, _ := strings.Cut(noPrefix, deliAs)

	// allow 'foo.bar' for schema.entity name as a reference
	// later I prevent it if kind is not relevant
	identifierStrBefore, identifierStrAfter, identifierStrHadPeriod := strings.Cut(identifierStr, ".")
	identifierStrBefore = Normalize(identifierStrBefore)
	identifierStrAfter = Normalize(identifierStrAfter)

	if identifierStrHadPeriod {
		identifierStr = fmt.Sprintf("%s.%s", identifierStrBefore, identifierStrAfter)
	} else {
		identifierStr = identifierStrBefore
	}

	var (
		kindStr, optsStr, _ = strings.Cut(_later, deliWith)
		optsRaw             = strings.Split(optsStr, ",")
		attr                = model.AttributeRaw{
			Name:   identifierStr,
			Alias:  Normalize(alias),
			Unique: make([]string, 0, len(optsRaw)),
		}
	)

	kindStr = strings.TrimSpace(kindStr)
	optsStr = strings.TrimSpace(optsStr)

	if len(identifierStr) == 0 {
		attr.AppendErr(ErrIdentifierRequired)
		return &attr
	}

	if len(kindStr) == 0 {
		attr.AppendErr(ErrKindRequired)
		return &attr
	}

	attr.Kind = determineAttrKind(kindStr)
	if attr.Kind == model.AttrKindNone {
		attr.AppendErr(ErrKindInvalid)
		return &attr
	}

	// prevent the case of 'foo.bar' from sneaking past if not a reference
	if identifierStrHadPeriod && attr.Kind != model.AttrKindReference {
		identifierStr = identifierStrBefore
	}

	var (
		primaries = []string{"p", "primary"}
		reqs      = []string{"r", "required"}
		uniques   = []string{"u", "unique"}
		defaults  = []string{"d", "default"}
	)

	for _, optRaw := range optsRaw {
		opt := strings.TrimSpace(optRaw)

		if len(opt) == 0 {
			continue
		}

		lowerOpt := strings.ToLower(opt)

		if slices.Contains(primaries, lowerOpt) {
			attr.Primary = true
			continue
		}

		if slices.Contains(reqs, lowerOpt) {
			attr.Required = sql.NullBool{Bool: true, Valid: true}
			continue
		}

		if strings.Contains(opt, deliRange) {
			minStr, maxStr, _ := strings.Cut(opt, deliRange)
			attr.Min = sql.NullString{String: minStr, Valid: len(minStr) > 0}
			attr.Max = sql.NullString{String: maxStr, Valid: len(maxStr) > 0}
			continue
		}

		if strings.Contains(opt, deliLabel) {
			str, label, _ := strings.Cut(opt, deliLabel)

			if slices.Contains(uniques, strings.ToLower(str)) {
				attr.Unique = append(attr.Unique, strcase.ToSnake(label))
			} else if slices.Contains(defaults, strings.ToLower(str)) {
				attr.DefaultValue = label
			}

			continue
		}
	}

	return &attr
}

func determineAttrKind(s string) model.AttrKind {
	kind := model.AttrKindNone

	switch strings.ToLower(s) {
	case "++", "auto", "auto increment", "increment":
		kind = model.AttrKindSerial
	case "int", "integer", "digit":
		kind = model.AttrKindInt
	case "bool", "boolean":
		kind = model.AttrKindBoolean
	case "str", "string", "varchar":
		kind = model.AttrKindString
	case "ts", "timestamp", "datetime":
		kind = model.AttrKindTimestamp
	case "date":
		kind = model.AttrKindDate
	case "time":
		kind = model.AttrKindTime
	case "bit":
		kind = model.AttrKindBit
	case "char", "character":
		kind = model.AttrKindChar
	case "dec", "decimal":
		kind = model.AttrKindDecimal
	case "real", "float":
		kind = model.AttrKindFloat
	case "ref", "reference":
		kind = model.AttrKindReference
	case "money":
		kind = model.AttrKindMoney
	}
	return kind
}
