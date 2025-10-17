package strparse

import (
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
	"github.com/iancoleman/strcase"
)

func newTblFromLine(s string) (*model.Entity, error) {
	noPrefix := strings.TrimPrefix(s, PrefixTbl)

	tbl := model.Entity{
		Name:       strcase.ToSnake(noPrefix),
		Attributes: make([]*model.Attribute, 0, 10),
	}

	return &tbl, nil
}
