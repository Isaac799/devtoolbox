package strparse

import "errors"

var (
	ErrAttrBad            = errors.New("bad attribute")
	ErrIdentifierRequired = errors.New("identifier required")
	ErrKindRequired       = errors.New("kind required")
	ErrKindInvalid        = errors.New("kind invalid")
)
