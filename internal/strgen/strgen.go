// Package strgen is designed to generate strings from a model
package strgen

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/iancoleman/strcase"
)

func renderCamel(s string) string {
	return strcase.ToLowerCamel(s)
}

func renderSnake(s string) string {
	return strcase.ToSnake(s)
}

func renderKebab(s string) string {
	return strcase.ToKebab(s)
}

func renderPascal(s string) string {
	return strcase.ToCamel(s)
}

// upAcronym tries to keep uppercase acronyms to aid in convention following,
// so "fooId" -> "fooID". It takes a string, and the convention to be used
// around the casing.
func upAcronym(s string, convention func(string) string) string {
	s = strcase.ToSnake(s)

	words := strings.Split(s, "_")
	acronyms := []string{
		"id", "html", "css", "js", "eol", "eof", "dob", "ttl",
	}

	type sChange struct {
		s       string
		changed bool
	}

	changes := make([]sChange, 0, len(words))

wordHunt:
	for _, word := range words {
		for _, ac := range acronyms {
			if word != ac {
				continue
			}
			fixed := strings.ReplaceAll(word, ac, strings.ToUpper(ac))
			changes = append(changes, sChange{s: fixed, changed: true})
			continue wordHunt
		}
		changes = append(changes, sChange{s: word, changed: false})
	}

	final := make([]string, 0, len(words))
	stack := make([]string, 0, len(words))

	var processStack = func() {
		if len(stack) == 0 {
			return
		}
		s := convention(strings.Join(stack, "_"))
		final = append(final, s)
		stack = make([]string, 0, len(words))
	}

	for _, change := range changes {
		if change.changed {
			processStack()
			final = append(final, change.s)
			continue
		}
		stack = append(stack, change.s)
	}
	processStack()

	return strings.Join(final, "")
}

func renderCamelUA(s string) string {
	return upAcronym(s, strcase.ToLowerCamel)
}

func renderPascalUA(s string) string {
	return upAcronym(s, strcase.ToCamel)
}

// FileName is used to key generated files
// to allow putting them in the correct place
type FileName string

func newFileName(path string, name string) FileName {
	s := fmt.Sprintf("%s:%s", path, name)
	return FileName(s)
}

func (fn FileName) Path() string {
	before, _, _ := strings.Cut(string(fn), ":")
	return before
}

func (fn FileName) fileName() string {
	_, after, _ := strings.Cut(string(fn), ":")
	return after
}

func (fn FileName) Full() string {
	before, after, _ := strings.Cut(string(fn), ":")
	return filepath.Join(before, after)
}
