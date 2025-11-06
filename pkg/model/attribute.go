package model

import (
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/Isaac799/devtoolbox/internal"
)

// AttrKind is the core type of an attribute
type AttrKind int

// recognized kinds
const (
	AttrKindNone AttrKind = iota
	AttrKindReference
	AttrKindSerial
	AttrKindInt
	AttrKindChar
	AttrKindString
	AttrKindBit
	AttrKindBoolean
	AttrKindDate
	AttrKindTime
	AttrKindTimestamp
	AttrKindFloat
	AttrKindReal
	AttrKindDecimal
	AttrKindMoney
)

var _attrKind = map[AttrKind]string{
	AttrKindNone:      "???",
	AttrKindReference: "???",
	AttrKindSerial:    "++",
	AttrKindInt:       "int",
	AttrKindChar:      "char",
	AttrKindString:    "string",
	AttrKindBit:       "bit",
	AttrKindBoolean:   "bool",
	AttrKindDate:      "date",
	AttrKindTime:      "time",
	AttrKindTimestamp: "timestamp",
	AttrKindFloat:     "float",
	AttrKindReal:      "real",
	AttrKindDecimal:   "decimal",
	AttrKindMoney:     "money",
}

// AttributeRaw is a metric in an entity, like a column in a table
type AttributeRaw struct {
	ID string

	Kind AttrKind

	Primary      bool
	Name         string
	Alias        string
	DefaultValue string

	Unique []string
	Err    []error

	Parent      *Entity
	ReferenceTo *Entity

	Validation
}

func NewAttribute(parent *Entity) *AttributeRaw {
	return &AttributeRaw{
		ID:     rand.Text(),
		Kind:   AttrKindInt,
		Name:   internal.NewFallbackName(),
		Unique: make([]string, 0, 2),
		Err:    make([]error, 0, 2),
		Parent: parent,
	}
}

// Path is a unique accessor value for focusing via the ux
func (attr *AttributeRaw) Path() string {
	return strings.Join([]string{
		attr.Parent.Parent.Name,
		attr.Parent.Name,
		attr.Name,
	}, "/")
}

// UniqueLabels allows string rep of unique labels, for templating entry
func (attr *AttributeRaw) UniqueLabels() string {
	return strings.Join(attr.Unique, ", ")
}

// String provides parsable text to generate itself
func (attr *AttributeRaw) String() string {
	opts := []string{}
	if attr.Primary {
		opts = append(opts, "primary")
	}
	if attr.Validation.Required.Bool {
		opts = append(opts, "required")
	}

	if len(attr.Validation.Min.String) > 0 || len(attr.Validation.Max.String) > 0 {
		opts = append(opts, fmt.Sprintf("%s..%s", attr.Validation.Min.String, attr.Validation.Max.String))
	}

	if len(attr.Unique) > 0 {
		for _, label := range attr.Unique {
			s := strings.TrimSpace(label)
			if len(s) == 0 {
				continue
			}
			opts = append(opts, fmt.Sprintf("unique:%s", s))
		}
	}
	if len(attr.DefaultValue) > 0 {
		opts = append(opts, fmt.Sprintf("default:%s", attr.DefaultValue))
	}

	parts := make([]string, 0, 10)

	if attr.ReferenceTo != nil {
		if len(attr.Alias) > 0 {
			parts = append(parts,
				"-",
				fmt.Sprintf("@%s", attr.ReferenceTo.Name),
				"as",
				attr.Alias,
			)
		} else {
			parts = append(parts,
				"-",
				fmt.Sprintf("@%s", attr.ReferenceTo.Name),
			)
		}

	} else {
		parts = append(parts,
			"-",
			attr.Name,
			"as",
			_attrKind[attr.Kind],
		)
	}

	if len(opts) > 0 {
		parts = append(parts,
			"with",
			strings.Join(opts, ", "),
		)
	}

	trimmed := make([]string, 0, len(parts))
	for _, s := range parts {
		trimmed = append(trimmed, strings.TrimSpace(s))
	}

	return strings.Join(trimmed, " ")
}

// AppendErr simplifies adding errors
func (attr *AttributeRaw) AppendErr(err error) {
	if attr.Err == nil {
		attr.Err = make([]error, 0, 1)
	}
	attr.Err = append(attr.Err, err)
}

// HasErr makes checking for err easier
func (attr *AttributeRaw) HasErr() bool {
	return len(attr.Err) > 0
}

// ErrString provides a template friendly way to print an err
func (attr *AttributeRaw) ErrString() string {
	sb := strings.Builder{}
	for i, err := range attr.Err {
		if i > 0 {
			sb.WriteString(", ")
		}
		sb.WriteString(err.Error())
	}
	return sb.String()
}

// HasDefault just checks is default is relevant. Used in templating.
func (attr *AttributeRaw) HasDefault() bool {
	return len(attr.DefaultValue) > 0
}

// MaybeRequireValidation will error and attr if it does not have the
// validation expected for its type
func (attr *AttributeRaw) MaybeRequireValidation() {
	switch attr.Kind {
	case AttrKindString:
		if len(attr.Max.String) == 0 {
			attr.AppendErr(ErrMaxLenRequired)
		}
	case AttrKindBit:
		if len(attr.Max.String) == 0 {
			attr.AppendErr(ErrBitSizeRequired)
		}
	}
}

// SanativeSerialKind will set and unset values accordingly
func (attr *AttributeRaw) SanativeSerialKind() {
	if attr.Kind != AttrKindSerial {
		return
	}
	attr.Primary = true
	attr.Required = sql.NullBool{Valid: true, Bool: true}
	attr.Min = sql.NullString{Valid: false}
	attr.Max = sql.NullString{Valid: false}
}

func (attr *AttributeRaw) EnsureValidAlias(ent *Entity) {
	consumedAlias := make([]string, 0, len(ent.RawAttributes))
	for _, a := range ent.RawAttributes {
		// concerned about aliases that are not self
		if a.ID == attr.ID {
			continue
		}
		if len(a.Alias) == 0 {
			continue
		}
		consumedAlias = append(consumedAlias, a.Alias)
	}

	if slices.Contains(consumedAlias, attr.Alias) {
		attr.Alias = ""
		// todo warnings
		// attr.AppendErr(ErrReusedAlias)
	}
}

func (attr *AttributeRaw) EnsureValidName(ent *Entity) {
	consumed := make([]string, 0, len(ent.RawAttributes))
	for _, a := range ent.RawAttributes {
		// concerned about self
		if a.ID == attr.ID {
			continue
		}
		consumed = append(consumed, a.Name)
	}

	if slices.Contains(consumed, attr.Name) {
		attr.Name = internal.NewFallbackName()
		// todo warnings
		// attr.AppendErr(ErrReusedName)
	}
}

func (attr *AttributeRaw) EnsureValidReference(schemas []*Schema) {
	if attr.ReferenceTo != nil {
		return
	}

	before, after, isFullRef := strings.Cut(attr.Name, ".")

	for _, sch := range schemas {
		for _, ent := range sch.Entities {
			// ID is set on gui delta
			if ent.ID == before {
				attr.ReferenceTo = ent
				attr.Name = fmt.Sprintf("%s.%s", ent.Parent.Name, ent.Name)
				return
			}

			if isFullRef {
				if before == sch.Name && after == ent.Name {
					attr.ReferenceTo = ent
					return
				}
				continue
			}

			if before == ent.Name {
				attr.ReferenceTo = ent
				return
			}
		}
	}

	attr.AppendErr(ErrInvalidReference)
}

func (attr *AttributeRaw) EnsureValidRange() {
	minStr := attr.Min.String
	maxStr := attr.Max.String

	switch attr.Kind {
	case AttrKindBit:
		attr.Min = sql.NullString{String: "", Valid: false}
		_, maxErr := strconv.Atoi(maxStr)
		if maxErr != nil {
			attr.AppendErr(ErrRangeMaxMalformed)
		}
	case AttrKindDate:
		min, minErr := time.Parse(time.DateOnly, minStr)
		max, maxErr := time.Parse(time.DateOnly, maxStr)
		if minErr != nil && len(minStr) > 0 {
			attr.AppendErr(ErrRangeMinMalformed)
		}
		if maxErr != nil && len(maxStr) > 0 {
			attr.AppendErr(ErrRangeMaxMalformed)
		}
		if len(minStr) > 0 && len(maxStr) > 0 && max.Before(min) {
			attr.AppendErr(ErrRangeMaxUnderMin)
		}
	case AttrKindTime:
		min, minErr := time.Parse(time.TimeOnly, minStr)
		max, maxErr := time.Parse(time.TimeOnly, maxStr)
		if minErr != nil && len(minStr) > 0 {
			attr.AppendErr(ErrRangeMinMalformed)
		}
		if maxErr != nil && len(maxStr) > 0 {
			attr.AppendErr(ErrRangeMaxMalformed)
		}
		if len(minStr) > 0 && len(maxStr) > 0 && max.Before(min) {
			attr.AppendErr(ErrRangeMaxUnderMin)
		}
	case AttrKindTimestamp:
		min, minErr := time.Parse(time.DateTime, minStr)
		max, maxErr := time.Parse(time.DateTime, maxStr)
		if minErr != nil && len(minStr) > 0 {
			attr.AppendErr(ErrRangeMinMalformed)
		}
		if maxErr != nil && len(maxStr) > 0 {
			attr.AppendErr(ErrRangeMaxMalformed)
		}
		if len(minStr) > 0 && len(maxStr) > 0 && max.Before(min) {
			attr.AppendErr(ErrRangeMaxUnderMin)
		}
	case AttrKindDecimal, AttrKindReal, AttrKindFloat, AttrKindInt, AttrKindMoney, AttrKindSerial, AttrKindString, AttrKindChar:
		min, minErr := strconv.ParseFloat(minStr, 64)
		max, maxErr := strconv.ParseFloat(maxStr, 64)
		if len(minStr) > 0 && minErr != nil {
			attr.AppendErr(ErrRangeMinMalformed)
		}
		if len(maxStr) > 0 && maxErr != nil {
			attr.AppendErr(ErrRangeMaxMalformed)
		}
		if len(minStr) > 0 && len(maxStr) > 0 && min > max {
			attr.AppendErr(ErrRangeMaxUnderMin)
		}
	}
}

// SanitizeDefaultValue will ensure that the default
// value is acceptable, and clear it if not, adding
// an Err if this takes place.
func (attr *AttributeRaw) SanitizeDefaultValue() {
	var (
		candidate = strings.TrimSpace(attr.DefaultValue)
		final     string
	)

	if len(candidate) == 0 {
		return
	}

	switch attr.Kind {
	case AttrKindNone:
		final = ""
	case AttrKindReference:
		final = "???"
	case AttrKindSerial, AttrKindInt:
		_, err := strconv.Atoi(candidate)
		if err != nil {
			attr.AppendErr(ErrMalformedDefault)
			break
		}
	case AttrKindString:
		final = candidate
	case AttrKindChar:
		if len(candidate) != 1 {
			attr.AppendErr(ErrMalformedDefault)
			break
		}
		final = candidate
	case AttrKindBit:
		size, _ := strconv.Atoi(attr.Max.String)
		parsed, err := strconv.ParseUint(candidate, 2, size)
		if err == nil {
			final = fmt.Sprintf("%0*b", size, parsed)
		} else {
			parsed, err := strconv.ParseUint(candidate, 10, size)
			if err != nil {
				attr.AppendErr(ErrMalformedDefault)
				break
			}
			final = fmt.Sprintf("%0*b", size, parsed)
		}
	case AttrKindBoolean:
		_, err := strconv.ParseBool(candidate)
		if err != nil {
			attr.AppendErr(ErrMalformedDefault)
			break
		}
	case AttrKindDate:
		if candidate == "now" {
			final = candidate
			break
		}
		parsed, err := time.Parse(time.DateOnly, candidate)
		if err != nil {
			attr.AppendErr(ErrMalformedDefault)
			break
		}
		final = parsed.Format(time.DateOnly)
	case AttrKindTime:
		if candidate == "now" {
			final = candidate
			break
		}
		parsed, err := time.Parse(time.TimeOnly, candidate)
		if err != nil {
			attr.AppendErr(ErrMalformedDefault)
			break
		}
		final = parsed.Format(time.TimeOnly)
	case AttrKindTimestamp:
		if candidate == "now" {
			final = candidate
			break
		}
		parsed, err := time.Parse(time.DateTime, candidate)
		if err != nil {
			attr.AppendErr(ErrMalformedDefault)
			break
		}
		final = parsed.Format(time.DateTime)
	case AttrKindDecimal, AttrKindReal, AttrKindFloat, AttrKindMoney:
		_, err := strconv.ParseFloat(candidate, 64)
		if err != nil {
			attr.AppendErr(ErrMalformedDefault)
			break
		}
	}

	for _, err := range attr.Err {
		if errors.Is(err, ErrMalformedDefault) {
			attr.DefaultValue = ""
			return
		}
	}

	attr.DefaultValue = strings.TrimSpace(final)
}
