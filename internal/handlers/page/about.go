package page

import (
	"net/http"

	"devtoolbox.org/pkg/services"
)

func About() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		services.RenderPage(w, r, "Home", "web/templates/page/about.html")
	}
}
