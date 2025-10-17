package strparse

import "regexp"

type LineKind int

const (
	LineKindNone LineKind = iota
	LineKindSch
	LineKindTbl
	LineKindAttr
)

const (
	PrefixSch  = "# "
	PrefixTbl  = "## "
	PrefixAttr = "- "
	DeliAs     = " as "
	DeliWith   = " with "
	DeliRange  = ".."
	DeliLabel  = ":"
)

var (
	RegDigit    = regexp.MustCompile("[0-9]")
	RegChar     = regexp.MustCompile("[a-zA-Z]")
	RegWordChar = regexp.MustCompile("\\w")
	RegWord     = regexp.MustCompile("^\\w+$")
)
