package page

import (
	"net/http"

	"devtoolbox.org/pkg/services"
)

func ServerError() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		services.RenderPage(w, r, "Server Error", "web/templates/page/server_error.html")
	}
}
