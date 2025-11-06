package strparse

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
