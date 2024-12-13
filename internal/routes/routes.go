package routes

import (
	"net/http"
	"path/filepath"

	"devtoolbox.org/internal/config"
	"devtoolbox.org/internal/constants"
	"devtoolbox.org/internal/handlers"
)

func RegisterRoutes(app *config.App) {
	mux := http.NewServeMux()

	mux.HandleFunc("/", handlers.Home())
	mux.HandleFunc("/home", handlers.Home())
	mux.HandleFunc("/about", handlers.About())
	mux.HandleFunc("/not-found", handlers.NotFound())
	mux.HandleFunc("/server-error", handlers.ServerError())
	mux.HandleFunc("/boilerplate", handlers.Boilerplate())

	mux.HandleFunc("/ws/boilerplate", app.WSServer.HandleWebSocket(constants.MessageTypeBoilerplate))

	mux.HandleFunc("/assets/{filename}", serveAsset)
	mux.HandleFunc("/webfonts/{filename}", serveAsset)

	mux.HandleFunc("/api/client", handlers.ClientHandler)

	app.Router.Handle("/", mux)
}

func serveAsset(w http.ResponseWriter, r *http.Request) {
	filename := r.PathValue("filename")
	path := filepath.Join("../../web/static", filename)

	contentType := "text/plain"

	switch filepath.Ext(path) {
	case ".css":
		contentType = "text/css"
	case ".png":
		contentType = "image/png"
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".gif":
		contentType = "image/gif"
	case ".svg":
		contentType = "image/svg+xml"
	case ".ico":
		contentType = "image/x-icon"
	case ".js":
		contentType = "application/javascript"
	case ".woff2":
		contentType = "font/woff2"
	case ".woff":
		contentType = "font/woff"
	case ".ttf":
		contentType = "font/ttf"
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "public, max-age=3600") // 1 hour cache
	http.ServeFile(w, r, path)
}
