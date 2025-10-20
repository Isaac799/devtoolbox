package strparse

import "errors"

var (
	ErrAttrBad            = errors.New("bad attribute")
	ErrIdentifierRequired = errors.New("identifier required")
	ErrKindRequired       = errors.New("kind required")
	ErrKindInvalid        = errors.New("kind invalid")
	ErrMissingMax         = errors.New("missing max")
	ErrRangeMinMalformed  = errors.New("range invalid: min malformed")
	ErrRangeMaxMalformed  = errors.New("range invalid: max malformed")
	ErrRangeMaxUnderMin   = errors.New("range invalid: max under min")
	ErrInvalidReference   = errors.New("cannot find reference")
	ErrReusedAlias        = errors.New("alias already used")
)
