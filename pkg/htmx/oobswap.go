// Package htmx is a collection of tools that help me interface with
// htmx features in a first-class way. Or at least ways that I think are cool.
package htmx

import (
	"bytes"
	"io"
	"net/http"
	"text/template"
)

// OobSwapper is a buffer designed around parsing templates
// for htmx oob swapping. Allowing zero to many sections to be
// written to the buffer.
type OobSwapper struct {
	buff *bytes.Buffer
}

// NewOobSwapper provides a new OobSwapper with a empty buffer
func NewOobSwapper() *OobSwapper {
	return &OobSwapper{
		buff: bytes.NewBuffer(nil),
	}
}

// FlushToResponseWriter will send the buffer to http client
func (oobSwapper *OobSwapper) FlushToResponseWriter(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Add("Content-Type", "text/html")
	oobSwapper.Flush(w)
}

// Flush will write the oob swapper buffer to a writer
func (oobSwapper *OobSwapper) Flush(w io.Writer) {
	w.Write(oobSwapper.buff.Bytes())
	oobSwapper.buff.Reset()
}

// Write will add an oob swap to the swapper buffer
func (oobSwapper *OobSwapper) Write(oobSwaps ...OobSwap) error {
	for _, oobSwap := range oobSwaps {
		if err := oobSwap(oobSwapper); err != nil {
			return err
		}
	}
	return nil
}

// OobSwap is fn that will execute a template into a oob swapper buffer
type OobSwap = func(*OobSwapper) error

// NewOobSwap provides a new out of band swap. Template option fns enable direct
// modification the the template before execution, to enable attaching things like fn map.
func NewOobSwap(
	templatePath, templateName string, data any,
	templateOptions ...func(*template.Template) error,
) OobSwap {
	return OobSwap(func(oobSwapper *OobSwapper) error {
		tmpl, err := template.ParseFiles(templatePath)
		if err != nil {
			return err
		}

		for _, templateOpt := range templateOptions {
			if err := templateOpt(tmpl); err != nil {
				return err
			}
		}

		if err := tmpl.ExecuteTemplate(oobSwapper.buff, templateName, data); err != nil {
			return err
		}
		return nil
	})
}
