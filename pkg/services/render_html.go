package services

import (
	"log"
	"net/http"
	"text/template"
	"time"
)

func RenderTemplate[T any](w http.ResponseWriter, title, templateName string, data T) {
	templateData := struct {
		Title string
		Year  int
		Data  interface{}
	}{
		Title: title,
		Year:  time.Now().Year(),
		Data:  data,
	}

	pageTemplate, err := template.ParseFiles(
		"../../web/templates/base.html",
		"../../"+templateName,
		"../../web/templates/navbar.html",
		"../../web/templates/footer.html",
	)

	if err != nil {
		log.Println("Error parsing templates:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	err = pageTemplate.ExecuteTemplate(w, "base.html", templateData)
	if err != nil {
		log.Println("Error executing template:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func RenderPageWithData[T any](w http.ResponseWriter, _ *http.Request, title, templateName string, data *T) {
	RenderTemplate(w, title, templateName, data)
}

func RenderPage(w http.ResponseWriter, _ *http.Request, title, templateName string) {
	RenderTemplate[any](w, title, templateName, nil)
}
