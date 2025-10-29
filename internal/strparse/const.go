package strparse

import "regexp"

type lineKind int

const (
	lineKindNone lineKind = iota
	lineKindSch
	lineKindEnt
	lineKindAttr
)

const (
	prefixSch  = "# "
	prefixEnt  = "## "
	prefixAttr = "- "
	deliAs     = " as "
	deliWith   = " with "
	deliRange  = ".."
	deliLabel  = ":"
)

var (
	regDigit    = regexp.MustCompile("[0-9]")
	regChar     = regexp.MustCompile("[a-zA-Z]")
	regWordChar = regexp.MustCompile("\\w")
	regWord     = regexp.MustCompile("^\\w+$")
)
