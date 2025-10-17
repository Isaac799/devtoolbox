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

func newAttributeFromLine(s string) (*model.Attribute, error) {
	var (
		noPrefix = strings.TrimPrefix(s, PrefixAttr)
		kind     model.AttrKind
	)

	var alias string

	_afterRefShortHand, found := strings.CutPrefix(noPrefix, "@")
	if found {
		if !strings.Contains(noPrefix, DeliAs) {
			kindStr, optsStr, _ := strings.Cut(_afterRefShortHand, DeliWith)
			noPrefix = fmt.Sprintf("%s as reference with %s", kindStr, optsStr)
		} else {
			identifierStr, after, _ := strings.Cut(_afterRefShortHand, DeliAs)
			kindStr, optsStr, _ := strings.Cut(after, DeliWith)
			alias = kindStr
			noPrefix = fmt.Sprintf("%s as reference with %s", identifierStr, optsStr)
		}
	}

	var (
		identifierStr, _later, _ = strings.Cut(noPrefix, DeliAs)
		kindStr, optsStr, _      = strings.Cut(_later, DeliWith)
		optsRaw                  = strings.Split(optsStr, ",")
		attr                     = model.Attribute{
			Name:   identifierStr,
			Kind:   kind,
			Alias:  alias,
			Unique: make([]string, 0, len(optsRaw)),
		}
	)

	identifierStr = strings.TrimSpace(identifierStr)
	kindStr = strings.TrimSpace(kindStr)
	optsStr = strings.TrimSpace(optsStr)

	if len(identifierStr) == 0 {
		return nil, ErrIdentifierRequired
	}
	if len(kindStr) == 0 {
		return nil, ErrKindRequired
	}

	kind = determineAttrKind(kindStr)
	if kind == model.AttrKindNone {
		return nil, ErrKindInvalid
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

		if strings.Contains(opt, DeliRange) {
			minStr, maxStr, _ := strings.Cut(opt, DeliRange)
			min, minErr := strconv.ParseFloat(minStr, 64)
			if minErr == nil {
				attr.Min = sql.NullFloat64{Float64: min, Valid: true}
			}
			max, maxErr := strconv.ParseFloat(maxStr, 64)
			if maxErr == nil {
				attr.Max = sql.NullFloat64{Float64: max, Valid: true}
			}
			continue
		}

		if strings.Contains(opt, DeliLabel) {
			str, label, _ := strings.Cut(opt, DeliLabel)

			if slices.Contains(uniques, strings.ToLower(str)) {
				attr.Unique = append(attr.Unique, strcase.ToSnake(label))
			} else if slices.Contains(defaults, strings.ToLower(str)) {
				attr.DefaultValue = label
			}

			continue
		}
	}

	return &attr, nil
}

func determineAttrKind(s string) model.AttrKind {
	kind := model.AttrKindNone

	switch strings.ToLower(s) {
	case "++", "auto", "auto increment", "increment":
		kind = model.AttrKindInt
	case "int", "integer", "digit":
		kind = model.AttrKindInt
	case "bool", "boolean":
		kind = model.AttrKindBoolean
	case "str", "string", "varchar":
		kind = model.AttrKindVarchar
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
