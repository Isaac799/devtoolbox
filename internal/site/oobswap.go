package site

import (
	"os"
	"path/filepath"
	"text/template"

	"github.com/Isaac799/devtoolbox/pkg/htmx"
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
		if _, err := t.ParseGlob(filepath.Join(wd, "public", "island", "output-*.html")); err != nil {
			return err
		}
		return nil
	}

	return htmx.NewOobSwap(
		filepath.Join(wd, "public", "island", "output.html"),
		"output",
		data,
		withOutputs,
	)
}
