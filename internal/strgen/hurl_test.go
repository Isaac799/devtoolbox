package strgen

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/Isaac799/devtoolbox/internal/strparse"
)

func TestHurlTests(t *testing.T) {
	wd, _ := os.Getwd()
	os.Chdir("..")
	os.Chdir("..")
	defer os.Chdir(wd)

	schemas := strparse.Raw(testMockSchemas)

	m, err := HurlTests(schemas)
	if err != nil {
		t.Fatal(err)
	}

	scope := filepath.Join("generated", "hurl")
	os.RemoveAll(scope)

	for k, v := range m {
		dir := filepath.Join(scope, k.Path())
		name := filepath.Join(scope, k.Full())

		os.MkdirAll(dir, os.ModePerm)
		os.WriteFile(name, []byte(v), os.ModePerm)
	}
}
