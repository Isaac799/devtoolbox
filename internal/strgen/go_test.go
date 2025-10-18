package strgen

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/Isaac799/devtoolbox/internal/strparse"
)

func TestGoStructs(t *testing.T) {
	wd, _ := os.Getwd()
	os.Chdir("..")
	os.Chdir("..")
	defer os.Chdir(wd)

	schemas := strparse.Raw(testMockSchemas)

	m, err := GoStructs(schemas)
	if err != nil {
		t.Fatal(err)
	}

	scope := filepath.Join("generated", "golang")
	os.RemoveAll(scope)

	for k, v := range m {
		dir := filepath.Join(scope, k.path())
		name := filepath.Join(scope, k.full())

		os.MkdirAll(dir, os.ModePerm)
		os.WriteFile(name, []byte(v), os.ModePerm)
	}
}
