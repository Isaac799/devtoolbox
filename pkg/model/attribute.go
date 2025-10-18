package model

import (
	"errors"
	"strconv"
	"strings"
	"time"
)

// AttrKind is the core type of an attribute
type AttrKind int

// recognized kinds
const (
	AttrKindNone AttrKind = iota
	AttrKindBit
	AttrKindDate
	AttrKindChar
	AttrKindTime
	AttrKindTimestamp
	AttrKindDecimal
	AttrKindReal
	AttrKindFloat
	AttrKindSerial
	AttrKindInt
	AttrKindBoolean
	AttrKindString
	AttrKindMoney
	AttrKindReference
)

// Attribute is a metric in an entity, like a column in a table
type Attribute struct {
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

// AppendErr simplifies adding errors
func (attr *Attribute) AppendErr(err error) {
	if attr.Err == nil {
		attr.Err = make([]error, 0, 1)
	}
	attr.Err = append(attr.Err, err)
}

// HasErr makes checking for err easier
func (attr *Attribute) HasErr() bool {
	return len(attr.Err) > 0
}

// HasDefault just checks is default is relevant. Used in templating.
func (attr *Attribute) HasDefault() bool {
	return len(attr.DefaultValue) > 0
}

// SanitizeDefaultValue will ensure that the default
// value is acceptable, and clear it if not, adding
// an Err if this takes place.
func (attr *Attribute) SanitizeDefaultValue() {
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
	case AttrKindBit:
		if candidate == "0" || candidate == "1" {
			final = candidate
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
	case AttrKindChar:
		if len(candidate) != 1 {
			attr.AppendErr(ErrMalformedDefault)
			break
		}
		final = candidate
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
	case AttrKindSerial, AttrKindInt:
		_, err := strconv.Atoi(candidate)
		if err != nil {
			attr.AppendErr(ErrMalformedDefault)
			break
		}
	case AttrKindBoolean:
		_, err := strconv.ParseBool(candidate)
		if err != nil {
			attr.AppendErr(ErrMalformedDefault)
			break
		}
	case AttrKindString:
		final = candidate
	case AttrKindReference:
		final = "???"
	}

	for _, err := range attr.Err {
		if errors.Is(err, ErrMalformedDefault) {
			attr.DefaultValue = ""
			return
		}
	}

	attr.DefaultValue = strings.TrimSpace(final)
}
