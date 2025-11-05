package model

import "errors"

var (
	ErrMalformedDefault = errors.New("unacceptable default value")
	ErrMaxLenRequired   = errors.New("upper range is required")
	ErrBitSizeRequired  = errors.New("bit size is required")
	ErrInvalidReference = errors.New("cannot find reference")

	ErrMissingMax        = errors.New("missing max")
	ErrRangeMinMalformed = errors.New("range invalid: min malformed")
	ErrRangeMaxMalformed = errors.New("range invalid: max malformed")
	ErrRangeMaxUnderMin  = errors.New("range invalid: max under min")
)
