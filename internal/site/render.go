package site

import (
	"bytes"
	"os"
	"path/filepath"
	"text/template"
)

// Render is the structure used for most templates
type Render struct {
	Client   *Client
	Examples []Example
}

func (c *Client) render() (*Render, error) {
	return &Render{
		Client:   c,
		Examples: defaultExamples(),
	}, nil
}

func (render *Render) input(buff *bytes.Buffer) error {
	var (
		wd, err = os.Getwd()
	)

	if err != nil {
		return err
	}

	s := filepath.Join(wd, "public", "island", "input.html")
	tmpl, err := template.ParseFiles(s)
	if err != nil {
		return err
	}

	{
		s := filepath.Join(wd, "public", "form", "*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			return err
		}
	}

	{
		s := filepath.Join(wd, "public", "island", "input-*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			return err
		}
	}

	if err := tmpl.ExecuteTemplate(buff, "input", render); err != nil {
		return err
	}

	return nil
}

func (render *Render) output(buff *bytes.Buffer) error {
	var (
		wd, err = os.Getwd()
	)

	if err != nil {
		return err
	}

	s := filepath.Join(wd, "public", "island", "output.html")
	tmpl, err := template.ParseFiles(s)
	if err != nil {
		return err
	}

	{
		s := filepath.Join(wd, "public", "island", "output-*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			return err
		}
	}

	if err := tmpl.ExecuteTemplate(buff, "output", render); err != nil {
		return err
	}

	return nil
}
