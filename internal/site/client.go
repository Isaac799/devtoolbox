package site

import (
	"archive/zip"
	"bytes"
	"crypto/rand"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/Isaac799/devtoolbox/internal/strgen"
	"github.com/Isaac799/devtoolbox/internal/strparse"
)

var (
	// _clientTTL is how long a client session is valid for
	// after their final action
	_clientTTL = time.Hour * 24 * 7

	// _cid is the name for the client ID cookie
	_cid = "cid"
)

// Client is my way of tracking state server side
type Client struct {
	ID   string
	CSRF string

	// mutex protects below
	mu     sync.Mutex
	Expire time.Time
	Input  Input
}

func (c *Client) extendLife() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.Expire = time.Now().Add(_clientTTL)
}

func (c *Client) setSessionCookie(w http.ResponseWriter) {
	c.extendLife()

	http.SetCookie(w, &http.Cookie{
		Name:     string(_cid),
		Value:    c.ID,
		Expires:  time.Now().Add(_clientTTL),
		SameSite: http.SameSiteLaxMode,
		HttpOnly: true,
		Path:     "/",
	})
}

func (c *Client) deltas(r *http.Request, mods ...delta) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for _, mod := range mods {
		mod(r, c)
	}
}

// NewClient makes a new client
func NewClient() *Client {
	return &Client{
		ID:   rand.Text(),
		CSRF: rand.Text(),
		Input: Input{
			Mode: InputModeGraphical,
			Q:    defaultExamples()[0].Value,
		},
	}
}

// ClientStore is my way of tracking multiple clients server side
type ClientStore struct {
	mu      sync.Mutex
	cap     int
	clients []*Client
}

// NewClientStore provides a the client store with good cap
func NewClientStore(cap int) *ClientStore {
	return &ClientStore{
		mu:      sync.Mutex{},
		cap:     cap,
		clients: make([]*Client, 0, cap),
	}
}

func (store *ClientStore) preserve(c *Client) {
	store.mu.Lock()
	defer store.mu.Unlock()

	if len(store.clients) >= store.cap {
		store.clients = store.clients[1:]
	}
	store.clients = append(store.clients, c)
}

// clientInfo provides a clientInfo and if the csrf matched
func (store *ClientStore) clientInfo(w http.ResponseWriter, r *http.Request) (*Client, bool) {
	store.removeExpired()

	var (
		cookie, cookieErr = r.Cookie(string(_cid))
		csrf              = r.Header.Get("X-CSRF-TOKEN")
		client            *Client
	)

	// allow forms to include csrf, mainly for downloads.
	// most of the time it will come from the headers though
	if len(csrf) == 0 {
		r.ParseForm()
		s := r.FormValue("X-CSRF-TOKEN")
		if len(s) > 0 {
			csrf = s
		}
	}

	if cookieErr == nil {
		for _, e := range store.clients {
			if e == nil {
				continue
			}
			if e.ID != cookie.Value {
				continue
			}
			client = e
			break
		}
	}

	if client == nil {
		return nil, false
	}

	csrfOk := client.CSRF == csrf

	if csrfOk {
		client.extendLife()
		client.setSessionCookie(w)
	}

	return client, csrfOk
}

func (store *ClientStore) removeExpired() {
	store.mu.Lock()
	defer store.mu.Unlock()

	valid := make([]*Client, 0, len(store.clients))
	for _, e := range store.clients {
		if e == nil {
			continue
		}
		if time.Now().After(e.Expire) {
			continue
		}
		valid = append(valid, e)
	}
	store.clients = valid
}

// Download allows downloading the generated as a zip
func (store *ClientStore) Download() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		client, csrfOk := store.clientInfo(w, r)
		if client == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		if !csrfOk {
			w.WriteHeader(http.StatusForbidden)
			return
		}

		schemas := strparse.Raw(client.Input.Q)

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
}
