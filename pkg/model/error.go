package model

import "errors"

var (
	ErrMalformedDefault = errors.New("unacceptable default value")
	ErrMaxLenRequired   = errors.New("upper range is required")
	ErrBitSizeRequired  = errors.New("bit size is required")

	ErrReference = errors.New("reference error")

	ErrNonExistent  = errors.New("cannot find reference")
	ErrEmptyPrimary = errors.New("missing primary")
	ErrUnset        = errors.New("is not set")

	ErrMissingMax        = errors.New("missing max")
	ErrRangeMinMalformed = errors.New("range invalid: min malformed")
	ErrRangeMaxMalformed = errors.New("range invalid: max malformed")
	ErrRangeMaxUnderMin  = errors.New("range invalid: max under min")
	ErrRangeMaxBelowZero = errors.New("range invalid: max below zero")
)
