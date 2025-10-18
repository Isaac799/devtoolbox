package strgen

import (
	"fmt"
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
		packageName := packageName(k)
		p := filepath.Join(scope, packageName)
		os.MkdirAll(p, os.ModePerm)
		fileName := filepath.Join(p, fmt.Sprintf("%s.go", packageName))
		os.WriteFile(fileName, []byte(v), os.ModePerm)
	}
}
