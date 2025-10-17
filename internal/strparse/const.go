package strparse

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
