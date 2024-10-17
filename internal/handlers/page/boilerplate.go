package page

import (
	"net/http"

	"devtoolbox.org/pkg/services"
)

func Boilerplate() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		services.RenderPage(w, r, "Server Error", "web/templates/boilerplate/index.html")
	}
}
