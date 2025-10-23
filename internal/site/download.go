package site

import (
	"archive/zip"
	"bytes"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/Isaac799/devtoolbox/internal/strgen"
	"github.com/Isaac799/devtoolbox/internal/strparse"
)

// DownloadHandler allows downloading the generated as a zip
func DownloadHandler(w http.ResponseWriter, r *http.Request) {
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

	pgGen, err := strgen.PostgresSetup(schemas)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	for k, v := range pgGen {
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

	zWriter.Close()
	archName := fmt.Sprintf("devtoolbox-%d", time.Now().Unix())
	b := buff.Bytes()

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`"attachment; filename="%s"`, archName))
	w.Header().Set("Content-Length", strconv.Itoa(len(b)))
	w.Write(b)
}
