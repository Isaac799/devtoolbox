package site

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"text/template"
)

// HandlerPageHome handles the home page.
// Located in /public/page
// No access to client information
// Limit access to public islands
func (store *ClientStore) HandlerPageHome(w http.ResponseWriter, r *http.Request) {
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
		s := filepath.Join(wd, "public", "fields", "*.html")
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

// HandlerPageHelp handles the help page
// Located in /public/page
// No access to client information
// Limit access to public islands
func (store *ClientStore) HandlerPageHelp(w http.ResponseWriter, _ *http.Request) {
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

// HandlerDialog handles the dialogs
// Located in /public/dialog
// Has access to client information
// Has access to islands
func (store *ClientStore) HandlerDialog(w http.ResponseWriter, r *http.Request) {
	var (
		wd, err = os.Getwd()
		tmpl    *template.Template
	)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	acceptable := []string{"_attribute", "_entity", "_examples", "_schema", "_settings"}
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
		s := filepath.Join(wd, "public", "fields", "*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	r.ParseForm()

	client.deltas(
		r,
		deltaQ, deltaMode, deltaExample,
	)

	templateData, err := client.templateData()
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Add("Content-Type", "text/html")
	tmpl.ExecuteTemplate(w, what, templateData)
}

// HandlerIsland handles the islands
// Located in /public/island
// Has access to client information
func (store *ClientStore) HandlerIsland(w http.ResponseWriter, r *http.Request) {
	var (
		wd, err = os.Getwd()
	)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	acceptable := []string{"_input", "_output", "_nav"}
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

	s := filepath.Join(wd, "public", "island", what+".html")
	tmpl, err := template.ParseFiles(s)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	{
		s := filepath.Join(wd, "public", "fields", "*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	r.ParseForm()

	client.deltas(
		r,
		deltaQ, deltaMode, deltaExample,
	)

	templateData, err := client.templateData()
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Add("Content-Type", "text/html")
	tmpl.ExecuteTemplate(w, what, templateData)
}

// HandlerDelta handles changes to a clients state and refreshes the entire page
// Has access to client information
func (store *ClientStore) HandlerDelta(w http.ResponseWriter, r *http.Request) {
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

	client.deltas(
		r,
		deltaQ, deltaMode, deltaExample, deltaFocus,
	)

	store.HandlerPageHome(w, r)
}

// HandlerFocus handles changes to a clients input state and refreshes the entire input section
// Has access to client information
func (store *ClientStore) HandlerFocus(w http.ResponseWriter, r *http.Request) {
	var (
		what    = "_input"
		wd, err = os.Getwd()
	)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
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

	s := filepath.Join(wd, "public", "island", what+".html")
	tmpl, err := template.ParseFiles(s)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	{
		s := filepath.Join(wd, "public", "fields", "*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	r.ParseForm()

	client.deltas(
		r,
		deltaFocus,
	)

	templateData, err := client.templateData()
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Add("Content-Type", "text/html")
	tmpl.ExecuteTemplate(w, what, templateData)
}
