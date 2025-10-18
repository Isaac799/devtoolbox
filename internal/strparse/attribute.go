package strparse

import (
	"database/sql"
	"fmt"
	"slices"
	"strconv"
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
	"github.com/iancoleman/strcase"
)

func newAttributeFromLine(s string) *model.Attribute {
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
	identifierStrBefore = normalize(identifierStrBefore)
	identifierStrAfter = normalize(identifierStrAfter)

	if identifierStrHadPeriod {
		identifierStr = fmt.Sprintf("%s.%s", identifierStrBefore, identifierStrAfter)
	} else {
		identifierStr = identifierStrBefore
	}

	var (
		kindStr, optsStr, _ = strings.Cut(_later, deliWith)
		optsRaw             = strings.Split(optsStr, ",")
		attr                = model.Attribute{
			Name:   identifierStr,
			Alias:  normalize(alias),
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
			min, minErr := strconv.ParseFloat(minStr, 64)
			if minErr == nil {
				attr.Min = sql.NullFloat64{Float64: min, Valid: true}
			}
			max, maxErr := strconv.ParseFloat(maxStr, 64)
			if maxErr == nil {
				attr.Max = sql.NullFloat64{Float64: max, Valid: true}
			}

			if attr.Min.Float64 > attr.Max.Float64 {
				attr.AppendErr(ErrRangeInvalid)
			}
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

	attr.SanitizeDefaultValue()

	if attr.Kind == model.AttrKindString && !attr.Validation.Max.Valid {
		attr.AppendErr(ErrMissingMax)
	}

	if attr.Kind == model.AttrKindSerial {
		attr.Primary = true
		attr.Required = sql.NullBool{Valid: true, Bool: true}
		attr.Min = sql.NullFloat64{Valid: false}
		attr.Max = sql.NullFloat64{Valid: false}
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
