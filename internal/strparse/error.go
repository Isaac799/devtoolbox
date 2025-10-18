package strparse

import "errors"

var (
	ErrAttrBad            = errors.New("bad attribute")
	ErrIdentifierRequired = errors.New("identifier required")
	ErrKindRequired       = errors.New("kind required")
	ErrKindInvalid        = errors.New("kind invalid")
	ErrMissingMax         = errors.New("missing max")
	ErrRangeInvalid       = errors.New("range is invalid")
	ErrInvalidReference   = errors.New("cannot find reference")
)
