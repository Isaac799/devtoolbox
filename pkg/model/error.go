package model

import "errors"

var (
	ErrMalformedDefault = errors.New("unacceptable default value")
	ErrMaxLenRequired   = errors.New("upper range is required")
	ErrBitSizeRequired  = errors.New("bit size is required")
)
