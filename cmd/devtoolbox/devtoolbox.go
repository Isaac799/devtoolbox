package main

import (
	"archive/zip"
	"bytes"
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"time"

	"github.com/Isaac799/devtoolbox/internal/strgen"
	"github.com/Isaac799/devtoolbox/internal/strparse"
	"github.com/Isaac799/devtoolbox/pkg/model"
	"github.com/Isaac799/go-fish/pkg/aquatic"
)

func setupPond() (*aquatic.Pond, error) {
	config := aquatic.NewPondOptions{}
	uxPond, err := aquatic.NewPond("public", config)
	if err != nil {
		return nil, err
	}

	assetPond, err := aquatic.NewPond("asset", aquatic.NewPondOptions{GlobalSmallFish: true})
	if err != nil {
		return nil, err
	}

	assetPond.FlowsInto(&uxPond)
	return &uxPond, nil
}

// Generated is the combined generations for template usage
// on a sardine
type Generated struct {
	Raw        string
	RawEscaped string
	Schemas    []*model.Schema
	GoGen      map[strgen.FileName]string
	PgGen      string
	HasErr     bool
}

func generate(r *http.Request) any {
	s := r.FormValue("q")

	schemas := strparse.Raw(s)
	goGen, err := strgen.GoStructs(schemas)
	if err != nil {
		return Generated{
			Raw:     "error happened",
			Schemas: make([]*model.Schema, 0),
			GoGen:   make(map[strgen.FileName]string),
		}
	}

	var hasErr bool
	for _, s := range schemas {
		if s.HasErr() {
			hasErr = true
			break
		}
	}

	pgGen, err := strgen.PostgresSetup(schemas)
	if err != nil {
		return Generated{
			Raw:     "error happened",
			Schemas: make([]*model.Schema, 0),
			GoGen:   make(map[strgen.FileName]string),
		}
	}
	return Generated{
		Raw:        s,
		RawEscaped: url.QueryEscape(s),
		Schemas:    schemas,
		GoGen:      goGen,
		PgGen:      pgGen,
		HasErr:     hasErr,
	}
}

func downloadHandler(w http.ResponseWriter, r *http.Request) {
	s := r.FormValue("q")

	if len(s) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	unescape, err := url.QueryUnescape(s)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	schemas := strparse.Raw(unescape)

	if len(schemas) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	buff := bytes.NewBuffer(nil)
	zWriter := zip.NewWriter(buff)

	goGen, err := strgen.GoStructs(schemas)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	for k, v := range goGen {
		zw, err := zWriter.Create(k.Full())
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		_, err = zw.Write([]byte(v))
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
	{
		pgGen, err := strgen.PostgresSetup(schemas)
		if err != nil {
			log.Fatal(err)
		}
		zw, err := zWriter.Create("postgres-tables.sql")
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		_, err = zw.Write([]byte(pgGen))
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	zWriter.Close()
	archName := fmt.Sprintf("devtoolbox-%d", time.Now().Unix())
	b := buff.Bytes()

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`"attachment; filename="%s"`, archName))
	w.Header().Set("Content-Length", strconv.Itoa(len(b)))
	w.Write(b)
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

	stockFish := aquatic.Stock{
		rx("/"):           {OnCatch: generate},
		rx("/_generated"): {OnCatch: generate},
	}
	pond.Stock(stockFish)

	pond.OnCatch = func(_ *http.Request) any {
		fmt.Println("caught a fish")
		return nil
	}

	go func() {
		for err := range pond.OnErr {
			fmt.Println(err.Error())
		}
	}()

	verbose := true
	mux := pond.CastLines(verbose)
	mux.HandleFunc("/download", downloadHandler)

	fmt.Println("gone fishing")
	http.ListenAndServe(":8080", mux)

}
