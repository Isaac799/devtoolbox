package site

import (
	"bytes"
	"net/http"
	"os"
	"path/filepath"
	"text/template"
)

// OobSwapper facilitates usage of htmx out of band swaps
type OobSwapper struct {
	Client   *Client
	Examples []Example
	buff     *bytes.Buffer
	wd       string
}

// NewOobSwapper lets me make a oob swapper for a client
// enabling swapping sections of the ui with customized
// content for that user
func NewOobSwapper(c *Client) *OobSwapper {
	var (
		wd, err = os.Getwd()
	)

	if err != nil {
		panic(err)
	}

	return &OobSwapper{
		buff:     bytes.NewBuffer(nil),
		Client:   c,
		Examples: DefaultExamples(),
		wd:       wd,
	}
}

// Flush will send the buffer to http client
func (oobSwapper *OobSwapper) Flush(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Add("Content-Type", "text/html")
	w.Write(oobSwapper.buff.Bytes())
}

// OobSwap is a optional section of the site to be rendered.
type OobSwap = func(*OobSwapper) error

// Write adds a oob swap to the buffer to later be flushed into http response
func (oobSwapper *OobSwapper) Write(oobSwaps ...OobSwap) error {
	for _, oobSwap := range oobSwaps {
		if err := oobSwap(oobSwapper); err != nil {
			return err
		}
	}
	return nil
}

var sectionInputText = OobSwap(func(oobSwapper *OobSwapper) error {
	s := filepath.Join(oobSwapper.wd, "public", "island", "input-text.html")
	tmpl, err := template.ParseFiles(s)
	if err != nil {
		return err
	}

	if err := tmpl.ExecuteTemplate(oobSwapper.buff, "input-text", oobSwapper); err != nil {
		return err
	}

	return nil
})

var sectionInputForm = OobSwap(func(oobSwapper *OobSwapper) error {
	s := filepath.Join(oobSwapper.wd, "public", "island", "input-form.html")
	tmpl, err := template.ParseFiles(s)
	if err != nil {
		return err
	}

	{
		s := filepath.Join(oobSwapper.wd, "public", "form", "*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			return err
		}
	}

	if err := tmpl.ExecuteTemplate(oobSwapper.buff, "input-form", oobSwapper); err != nil {
		return err
	}

	return nil
})

var sectionInputTree = OobSwap(func(oobSwapper *OobSwapper) error {
	s := filepath.Join(oobSwapper.wd, "public", "island", "input-tree.html")
	tmpl, err := template.ParseFiles(s)
	if err != nil {
		return err
	}

	if err := tmpl.ExecuteTemplate(oobSwapper.buff, "input-tree", oobSwapper); err != nil {
		return err
	}

	return nil
})

var sectionInput = OobSwap(func(oobSwapper *OobSwapper) error {
	s := filepath.Join(oobSwapper.wd, "public", "island", "input*.html")
	tmpl, err := template.ParseGlob(s)
	if err != nil {
		return err
	}

	{
		s := filepath.Join(oobSwapper.wd, "public", "form", "*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			return err
		}
	}

	if err := tmpl.ExecuteTemplate(oobSwapper.buff, "input", oobSwapper); err != nil {
		return err
	}

	return nil
})

var sectionOutputTree = OobSwap(func(oobSwapper *OobSwapper) error {
	s := filepath.Join(oobSwapper.wd, "public", "island", "output-tree.html")
	tmpl, err := template.ParseFiles(s)
	if err != nil {
		return err
	}

	if err := tmpl.ExecuteTemplate(oobSwapper.buff, "output-tree", oobSwapper); err != nil {
		return err
	}

	return nil
})

var sectionOutput = OobSwap(func(oobSwapper *OobSwapper) error {
	s := filepath.Join(oobSwapper.wd, "public", "island", "output*.html")
	tmpl, err := template.ParseGlob(s)
	if err != nil {
		return err
	}

	if err := tmpl.ExecuteTemplate(oobSwapper.buff, "output", oobSwapper); err != nil {
		return err
	}

	return nil
})
