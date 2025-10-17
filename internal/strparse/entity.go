package strparse

import (
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
)

func newEntFromLine(s string) (*model.Entity, error) {
	noPrefix := strings.TrimPrefix(s, prefixEnt)

	ent := model.Entity{
		Name:       normalize(noPrefix),
		Attributes: make([]*model.Attribute, 0, 10),
	}

	return &ent, nil
}
