package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/Isaac799/devtoolbox/internal/site"
)

func main() {
	b := flag.Bool("debug", false, "moves up 2 dir")
	flag.Parse()
	if b != nil && *b {
		os.Chdir("..")
		os.Chdir("..")
	}

	store := site.NewClientStore(100)

	mux := http.NewServeMux()

	script := http.FileServer(http.Dir(filepath.Join("public", "asset")))
	mux.Handle("/public/asset/", http.StripPrefix("/public/asset/", script))

	mux.HandleFunc("/dialog/{what}", store.HandlerDialog)
	mux.HandleFunc("/island/{what}", store.HandlerIsland)
	mux.HandleFunc("/download", store.Download())
	mux.HandleFunc("/help", store.HandlerPageHelp)
	mux.HandleFunc("/delta", store.HandlerDelta)
	mux.HandleFunc("/home", store.HandlerPageHome)
	mux.HandleFunc("/make/{what}", site.Make)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/home", http.StatusTemporaryRedirect)
	})

	fmt.Println("running")
	http.ListenAndServe(":8080", mux)

}
