package strparse

import (
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
)

func newTblFromLine(s string) (*model.Entity, error) {
	noPrefix := strings.TrimPrefix(s, PrefixTbl)

	tbl := model.Entity{
		Name:       normalize(noPrefix),
		Attributes: make([]*model.Attribute, 0, 10),
	}

	return &tbl, nil
}
