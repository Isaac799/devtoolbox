package strparse

import (
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
	"github.com/iancoleman/strcase"
)

func newSchFromLine(s string) (*model.Schema, error) {
	noPrefix := strings.TrimPrefix(s, PrefixSch)

	sch := model.Schema{
		Name:     strcase.ToSnake(noPrefix),
		Entities: make([]*model.Entity, 0, 5),
	}

	return &sch, nil
}
