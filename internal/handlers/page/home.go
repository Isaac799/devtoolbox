package page

import (
	"net/http"

	"devtoolbox.org/pkg/services"
)

func Home() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		services.RenderPage(w, r, "Home", "web/templates/page/home.html")
	}
}
