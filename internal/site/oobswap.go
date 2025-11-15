package site

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"text/template"
	"unicode/utf8"

	"github.com/Isaac799/devtoolbox/pkg/htmx"
	"github.com/alecthomas/chroma/v2"
	"github.com/alecthomas/chroma/v2/formatters"
	"github.com/alecthomas/chroma/v2/lexers"
	"github.com/alecthomas/chroma/v2/styles"
)

type templateData struct {
	Client   *Client
	Examples []Example
}

func oobSwapInput(client *Client) htmx.OobSwap {
	data := templateData{
		Client:   client,
		Examples: DefaultExamples(),
	}

	wd, _ := os.Getwd()

	withInputs := func(t *template.Template) error {
		if _, err := t.ParseGlob(filepath.Join(wd, "public", "island", "input-*.html")); err != nil {
			return err
		}
		return nil
	}

	withForms := func(t *template.Template) error {
		if _, err := t.ParseGlob(filepath.Join(wd, "public", "form", "*.html")); err != nil {
			return err
		}
		return nil
	}

	return htmx.NewOobSwap(
		filepath.Join(wd, "public", "island", "input.html"),
		"input",
		data,
		withInputs, withForms,
	)
}

func oobSwapOutput(client *Client) htmx.OobSwap {
	data := templateData{
		Client:   client,
		Examples: DefaultExamples(),
	}

	wd, _ := os.Getwd()

	withOutputs := func(t *template.Template) error {
		t, err := t.ParseGlob(filepath.Join(wd, "public", "island", "output-*.html"))
		if err != nil {
			return err
		}
		return nil
	}

	withFuncMap := func(t *template.Template) error {
		t.Funcs(template.FuncMap{
			"stringSize": func(s string) string {
				return fmt.Sprintf("%d bytes", utf8.RuneCountInString(s))
			},
			"chroma": func(s string, useLexer string) string {
				if !client.Input.Chroma {
					return s
				}

				lexer := lexers.Get(useLexer)
				lexer = chroma.Coalesce(lexer)
				style := styles.Get("github")
				if style == nil {
					style = styles.Fallback
				}
				formatter := formatters.Get("html")
				if formatter == nil {
					formatter = formatters.Fallback
				}
				iterator, err := lexer.Tokenise(nil, s)
				if err != nil {
					fmt.Println(err)
					return s
				}
				buff := bytes.NewBuffer(nil)
				err = formatter.Format(buff, style, iterator)
				if err != nil {
					fmt.Println(err)
					return s
				}
				return buff.String()
			},
		})
		return nil
	}

	return htmx.NewOobSwap(
		filepath.Join(wd, "public", "island", "output.html"),
		"output",
		data,
		withFuncMap, withOutputs,
	)
}
