package strparse

import (
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
)

func newSchFromLine(s string) (*model.Schema, error) {
	noPrefix := strings.TrimPrefix(s, prefixSch)

	sch := model.Schema{
		Name:     normalize(noPrefix),
		Entities: make([]*model.Entity, 0, 5),
	}

	return &sch, nil
}
