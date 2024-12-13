package handlers

import (
	"net/http"

	"devtoolbox.org/pkg/services"
)

func ServerError() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		services.RenderPage(w, r, "Server Error", "web/templates/page/server_error.html")
	}
}

func NotFound() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		services.RenderPage(w, r, "Not Found", "web/templates/page/not_found.html")
	}
}

func Home() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		services.RenderPage(w, r, "Home", "web/templates/page/home.html")
	}
}

func About() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		services.RenderPage(w, r, "Home", "web/templates/page/about.html")
	}
}
