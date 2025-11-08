package site

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"text/template"

	"github.com/Isaac799/devtoolbox/internal/strparse"
	"github.com/Isaac799/devtoolbox/pkg/model"
)

// HandlePageHome handles the home page.
// Located in /public/page
// No access to client information
// Limit access to public islands
func (store *ClientStore) HandlePageHome(w http.ResponseWriter, r *http.Request) {
	var (
		wd, err = os.Getwd()
		tmpl    *template.Template
	)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	client, _ := store.clientInfo(w, r)
	if client == nil {
		client = NewClient()
		store.preserve(client)
		client.setSessionCookie(w)
	}

	client.setSessionCookie(w)

	{
		s := filepath.Join(wd, "public", "page", "home.html")
		tmpl, err = template.ParseFiles(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
	{
		s := filepath.Join(wd, "public", "island", "*.pub.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
	{
		s := filepath.Join(wd, "public", "form", "*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Add("Content-Type", "text/html")
	tmpl.Execute(w, client.CSRF)
}

// HandlePageHelp handles the help page
// Located in /public/page
// No access to client information
// Limit access to public islands
func (store *ClientStore) HandlePageHelp(w http.ResponseWriter, _ *http.Request) {
	var (
		wd, err = os.Getwd()
		tmpl    *template.Template
	)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	{
		s := filepath.Join(wd, "public", "page", "help.html")
		tmpl, err = template.ParseFiles(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
	{
		s := filepath.Join(wd, "public", "island", "*.pub.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Add("Content-Type", "text/html")
	tmpl.Execute(w, nil)
}

// HandlePageAbout handles the help page
// Located in /public/about
// No access to client information
// Limit access to public islands
func (store *ClientStore) HandlePageAbout(w http.ResponseWriter, _ *http.Request) {
	var (
		wd, err = os.Getwd()
		tmpl    *template.Template
	)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	{
		s := filepath.Join(wd, "public", "page", "about.html")
		tmpl, err = template.ParseFiles(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
	{
		s := filepath.Join(wd, "public", "island", "*.pub.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Add("Content-Type", "text/html")
	tmpl.Execute(w, nil)
}

// HandleDialog handles the dialogs
// Located in /public/dialog
// Has access to client information
// Has access to islands
func (store *ClientStore) HandleDialog(w http.ResponseWriter, r *http.Request) {
	var (
		wd, err = os.Getwd()
		tmpl    *template.Template
	)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	acceptable := []string{"example", "setting"}
	what := r.PathValue("what")
	if !slices.Contains(acceptable, what) {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	client, csrfOk := store.clientInfo(w, r)
	if client == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if !csrfOk {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	{
		s := filepath.Join(wd, "public", "dialog", what+".html")
		tmpl, err = template.ParseFiles(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
	{
		s := filepath.Join(wd, "public", "island", "*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
	{
		s := filepath.Join(wd, "public", "form", "*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	oobSwapper := NewOobSwapper(client)
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Add("Content-Type", "text/html")
	tmpl.ExecuteTemplate(w, what, oobSwapper)

}

// HandleIsland handles the islands
// Located in /public/island
// Has access to client information
func (store *ClientStore) HandleIsland(w http.ResponseWriter, r *http.Request) {
	client, csrfOk := store.clientInfo(w, r)
	if client == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if !csrfOk {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	r.ParseForm()

	// TODO remove: allows setting initial off example
	if len(client.Input.Q) > 0 && (client.LastOutput == nil || len(client.LastOutput.Schemas) == 0) {
		client.LastOutput = emptyLastOutput(strparse.Raw(client.Input.Q))

		err := client.SetOutput()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
	}

	oobSwapper := NewOobSwapper(client)

	var (
		what = r.PathValue("what")
	)

	switch what {
	case "input":
		if err := oobSwapper.Write(sectionInput); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
	case "output":
		if err := oobSwapper.Write(sectionOutput); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
	default:
		fmt.Println("unknown island: ", what)
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	oobSwapper.Flush(w)
	client.Dirty = 0
}

// HandleChange handles changes to a clients state and refreshes the entire page
// Has access to client information
func (store *ClientStore) HandleChange(w http.ResponseWriter, r *http.Request) {
	client, csrfOk := store.clientInfo(w, r)
	if client == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if !csrfOk {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	oobSwapper := NewOobSwapper(client)
	r.ParseForm()

	client.change(r, changeFocus)
	if client.Dirty&MaskDirtyFocus == MaskDirtyFocus {
		if err := oobSwapper.Write(sectionInput); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
		oobSwapper.Flush(w)
		client.Dirty = 0
		return
	}

	client.change(
		r,
		changeExample, changeQ, changeMode,
		changeSchema, changeEntity, changeAttribute,
	)

	client.LastOutput.refreshSchemas()
	err := client.SetOutput()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	if client.Dirty&MaskDirtyQ == MaskDirtyQ {
		if err := oobSwapper.Write(sectionOutputTree); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
	} else if client.Dirty&MaskDirtyFocus == MaskDirtyFocus {
		if err := oobSwapper.Write(sectionInput); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
	} else {
		if err := oobSwapper.Write(sectionInput, sectionOutput); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
	}

	oobSwapper.Flush(w)
	client.Dirty = 0
}

// HandleChildPost adds a new child to a schema, entity, or attribute
func (store *ClientStore) HandleChildPost(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if len(id) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	client, csrfOk := store.clientInfo(w, r)
	if client == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if !csrfOk {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	if id == "root" {
		schema := model.NewSchema()
		client.LastOutput.Schemas = append(client.LastOutput.Schemas, schema)
		client.Input.Focus.RawID = schema.ID
		client.setFocus()
	} else {
		for si := range client.LastOutput.Schemas {
			if client.LastOutput.Schemas[si].ID == id {
				entity := model.NewEntity(client.LastOutput.Schemas[si])
				client.LastOutput.Schemas[si].Entities = append(client.LastOutput.Schemas[si].Entities, entity)
				client.Input.Focus.RawID = entity.ID
				client.setFocus()
				break
			}
			for ei := range client.LastOutput.Schemas[si].Entities {
				if client.LastOutput.Schemas[si].Entities[ei].ID == id {
					attr := model.NewAttribute(client.LastOutput.Schemas[si].Entities[ei])
					client.LastOutput.Schemas[si].Entities[ei].RawAttributes = append(client.LastOutput.Schemas[si].Entities[ei].RawAttributes, attr)
					client.Input.Focus.RawID = attr.ID
					client.setFocus()
					break
				}
			}
		}
	}

	err := client.SetOutput()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	oobSwapper := NewOobSwapper(client)

	if err := oobSwapper.Write(sectionInput, sectionOutput); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	oobSwapper.Flush(w)
	client.Dirty = 0

}

// HandleChildDelete removes a child from a schema, entity, or attribute
func (store *ClientStore) HandleChildDelete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if len(id) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	client, csrfOk := store.clientInfo(w, r)
	if client == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if !csrfOk {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	removed := false
	for si, schema := range client.LastOutput.Schemas {
		if schema.ID == id {
			removed = true
			client.LastOutput.Schemas = slices.Delete(client.LastOutput.Schemas, si, si+1)
			break
		}
		for ei, entity := range schema.Entities {
			if entity.ID == id {
				removed = true
				schema.Entities = slices.Delete(schema.Entities, ei, ei+1)
				break
			}
			for i, attr := range entity.RawAttributes {
				if attr.ID == id {
					entity.RawAttributes = slices.Delete(entity.RawAttributes, i, i+1)
					removed = true
					break
				}

			}
		}
	}

	if !removed {
		w.WriteHeader(http.StatusUnprocessableEntity)
		return
	}

	client.LastOutput.refreshSchemas()
	client.clearFocus()
	client.SetOutput()

	oobSwapper := NewOobSwapper(client)
	if err := oobSwapper.Write(sectionInput, sectionOutput); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	oobSwapper.Flush(w)
	client.Dirty = 0
}
