package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"

	"github.com/Isaac799/devtoolbox/internal/site"
	"github.com/Isaac799/go-fish/pkg/aquatic"
)

func setupPond() (*aquatic.Pond, error) {
	config := aquatic.NewPondOptions{}
	uxPond, err := aquatic.NewPond("public/page", config)
	if err != nil {
		return nil, err
	}

	dialogPond, err := aquatic.NewPond("public/dialog", aquatic.NewPondOptions{GlobalSmallFish: true})
	if err != nil {
		return nil, err
	}
	dialogPond.FlowsInto(&uxPond)

	assetPond, err := aquatic.NewPond("public/asset", aquatic.NewPondOptions{GlobalSmallFish: true})
	if err != nil {
		return nil, err
	}

	assetPond.FlowsInto(&uxPond)
	return &uxPond, nil
}

func main() {
	b := flag.Bool("debug", false, "moves up 2 dir")
	flag.Parse()
	if b != nil && *b {
		os.Chdir("..")
		os.Chdir("..")
	}

	wd, _ := os.Getwd()
	fmt.Println(wd)

	pond, err := setupPond()
	if err != nil {
		log.Fatal(err.Error())
	}

	rx := regexp.MustCompile

	store := site.NewClientStore(100)

	stockFish := aquatic.Stock{
		rx("/"): {
			BeforeCatch: []aquatic.BeforeCatchFn{store.EnsureClient()},
			OnCatch:     site.OnCatchForGenerate,
		},
	}
	pond.Stock(stockFish)

	go func() {
		for err := range pond.OnErr {
			fmt.Println(err.Error())
		}
	}()

	verbose := true
	mux := pond.CastLines(verbose)
	mux.HandleFunc("/download", store.Download())
	mux.HandleFunc("/make/{what}", site.Make)

	fmt.Println("gone fishing")
	http.ListenAndServe(":8080", mux)

}
