package internal

import (
	"crypto/rand"
	"regexp"
	"strings"

	"github.com/iancoleman/strcase"
)

var (
	regDigit    = regexp.MustCompile("[0-9]")
	regChar     = regexp.MustCompile("[a-zA-Z]")
	regWordChar = regexp.MustCompile("\\w")
	regWord     = regexp.MustCompile("^\\w+$")
)

// Normalize makes a string follow my naming convention of snake, but with digit consideration
// for valid syntax on generated code
func Normalize(s string) string {
	s = strings.ToLower(strcase.ToSnake(s))

	ok := make([]rune, 0, len(s))
	var prev rune

	for i, r := range s {
		if len(ok) == 0 && r == '_' {
			continue
		}

		if r == '_' && prev == '_' {
			continue
		}

		// no digit first char
		if i == 0 {
			if matched, _ := regexp.Match(regDigit.String(), []byte(string(r))); matched {
				continue
			}
		}
		// word chars (snake) only
		if matched, _ := regexp.Match(regWordChar.String(), []byte(string(r))); !matched {
			continue
		}

		ok = append(ok, r)
		prev = r
	}

	return string(ok)
}

// NewFallbackName provides a unique name
func NewFallbackName() string {
	return Normalize("unset " + rand.Text()[:5])
}
