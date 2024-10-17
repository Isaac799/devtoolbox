package page

import (
	"net/http"

	"devtoolbox.org/pkg/services"
)

func NotFound() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		services.RenderPage(w, r, "Not Found", "web/templates/page/not_found.html")
	}
}
