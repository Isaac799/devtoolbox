package strparse

import (
	"strings"

	"github.com/Isaac799/devtoolbox/pkg/model"
)

func newSchFromLine(s string) (*model.Schema, error) {
	noPrefix := strings.TrimPrefix(s, prefixSch)

	var (
		name, optsStr, _ = strings.Cut(noPrefix, deliWith)
		optsRaw          = strings.Split(optsStr, ",")
	)

	sch := model.Schema{
		Name:     Normalize(name),
		Entities: make([]*model.Entity, 0, 5),
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

	return &sch, nil
}
