package main

import (
	"flag"
	"fmt"
	"log"
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

	mux.HandleFunc("/child/{id}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			store.HandleChildPost(w, r)
		case http.MethodDelete:
			store.HandleChildDelete(w, r)
		default:
			http.Error(w, "", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/change", store.HandleChange)

	mux.HandleFunc("/dialog/{what}", store.HandleDialog)
	mux.HandleFunc("/island/{what}", store.HandleIsland)
	mux.HandleFunc("/download", store.Download())

	// pages
	mux.HandleFunc("/about", store.HandlePageAbout)
	mux.HandleFunc("/help", store.HandlePageHelp)
	mux.HandleFunc("/home", store.HandlePageHome)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/home", http.StatusTemporaryRedirect)
	})

	fmt.Println("running")
	err := http.ListenAndServe(":8080", mux)
	if err != nil {
		log.Fatal(err)
	}
}
