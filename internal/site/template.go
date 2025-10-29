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
// Has access to client information
// Has access to islands
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
		s := filepath.Join(wd, "public", "island", "*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	client := store.resume(w, r)
	r.ParseForm()

	client.deltas(
		r,
		deltaQ, deltaMode, deltaExample,
	)

	out, err := output(&client.State.Input)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	state := renderState(client)
	state.Output = out

	w.Header().Add("Content-Type", "text/html")
	tmpl.Execute(w, state)
}

// HandlerPageHelp handles the help page
// Located in /public/page
// Has access to islands
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
		s := filepath.Join(wd, "public", "island", "*.html")
		tmpl, err = tmpl.ParseGlob(s)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

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

	client := store.resume(w, r)
	r.ParseForm()

	client.deltas(
		r,
		deltaQ, deltaMode, deltaExample,
	)

	out, err := output(&client.State.Input)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	state := renderState(client)
	state.Output = out

	w.Header().Add("Content-Type", "text/html")
	tmpl.ExecuteTemplate(w, what, state)
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

	s := filepath.Join(wd, "public", "island", what+".html")
	tmpl, err := template.ParseFiles(s)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	client := store.resume(w, r)
	r.ParseForm()

	client.deltas(
		r,
		deltaQ, deltaMode, deltaExample,
	)

	out, err := output(&client.State.Input)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	state := renderState(client)
	state.Output = out

	w.Header().Add("Content-Type", "text/html")
	tmpl.ExecuteTemplate(w, what, state)
}
