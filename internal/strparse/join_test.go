package strparse

import (
	"fmt"
	"os"
	"testing"
)

func TestJoin(t *testing.T) {
	wd, _ := os.Getwd()
	os.Chdir("..")
	os.Chdir("..")
	defer os.Chdir(wd)

	schemas := Raw(testMockSchemas)

	relationMaker := NewRelationMaker(schemas)
	relations := relationMaker.Determine()

	for _, relation := range relations {
		if relation.Many {
			fmt.Println(fmt.Sprintf("%s has many %s", relation.Base.Name, relation.Has.Name))
		} else {
			fmt.Println(fmt.Sprintf("%s has one %s", relation.Base.Name, relation.Has.Name))
		}
	}
}
