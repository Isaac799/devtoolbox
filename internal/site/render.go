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

func (render *Render) inputText(buff *bytes.Buffer) error {
	var (
		wd, err = os.Getwd()
	)

	if err != nil {
		return err
	}

	s := filepath.Join(wd, "public", "island", "input-text.html")
	tmpl, err := template.ParseFiles(s)
	if err != nil {
		return err
	}

	if err := tmpl.ExecuteTemplate(buff, "input-text", render); err != nil {
		return err
	}

	return nil
}

func (render *Render) inputForm(buff *bytes.Buffer) error {
	var (
		wd, err = os.Getwd()
	)

	if err != nil {
		return err
	}

	s := filepath.Join(wd, "public", "island", "input-form.html")
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

	if err := tmpl.ExecuteTemplate(buff, "input-form", render); err != nil {
		return err
	}

	return nil
}

func (render *Render) inputTree(buff *bytes.Buffer) error {
	var (
		wd, err = os.Getwd()
	)

	if err != nil {
		return err
	}

	s := filepath.Join(wd, "public", "island", "input-tree.html")
	tmpl, err := template.ParseFiles(s)
	if err != nil {
		return err
	}

	if err := tmpl.ExecuteTemplate(buff, "input-tree", render); err != nil {
		return err
	}

	return nil
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

func (render *Render) outputTree(buff *bytes.Buffer) error {
	var (
		wd, err = os.Getwd()
	)

	if err != nil {
		return err
	}

	s := filepath.Join(wd, "public", "island", "output-tree.html")
	tmpl, err := template.ParseFiles(s)
	if err != nil {
		return err
	}

	if err := tmpl.ExecuteTemplate(buff, "output-tree", render); err != nil {
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
