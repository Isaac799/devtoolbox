package strparse

import (
	"strings"

	"github.com/Isaac799/devtoolbox/internal"
	"github.com/Isaac799/devtoolbox/pkg/model"
)

func newEntFromLine(s string) (*model.Entity, error) {
	noPrefix := strings.TrimPrefix(s, prefixEnt)

	var (
		name, optsStr, _ = strings.Cut(noPrefix, deliWith)
		optsRaw          = strings.Split(optsStr, ",")
	)

	ent := model.Entity{
		Name:          internal.Normalize(name),
		RawAttributes: make([]*model.AttributeRaw, 0, 10),
	}

	for _, optRaw := range optsRaw {
		opt := strings.TrimSpace(optRaw)

		if len(opt) == 0 {
			continue
		}

		if strings.Contains(opt, deliLabel) {
			str, label, _ := strings.Cut(opt, deliLabel)
			_ = str
			_ = label
			break
		}
	}

	return &ent, nil
}
