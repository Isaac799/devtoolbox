package site

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/rand"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/Isaac799/devtoolbox/internal/strgen"
	"github.com/Isaac799/devtoolbox/internal/strparse"
)

type ClientKey string

var (
	// ClientTTL is how long a client session is valid for
	// after their final action
	ClientTTL = time.Hour * 24 * 7

	_cid = ClientKey("cid")
)

// Client is my way of tracking state server side
type Client struct {
	ID    string
	State *ClientState
}

type delta = func(*http.Request, *Client)

var deltaQ = delta(func(r *http.Request, c *Client) {
	const k = "q"
	_, exists := r.Form[k]
	if !exists {
		return
	}
	c.State.Input.Q = r.FormValue(k)
})

var deltaMode = delta(func(r *http.Request, c *Client) {
	const k = "mode"
	_, exists := r.Form[k]
	if !exists {
		return
	}

	mode := InputModeText
	modeStr := r.FormValue(k)
	modeInt, err := strconv.Atoi(modeStr)
	if err == nil {
		if modeInt == int(InputModeGraphical) {
			mode = InputModeGraphical
		}
	}
	c.State.Input.Mode = mode
})

var deltaExample = delta(func(r *http.Request, c *Client) {
	const k = "example"
	_, exists := r.Form[k]
	if !exists {
		return
	}
	c.State.Input.Q = r.FormValue(k)
})

func (c *Client) deltas(r *http.Request, mods ...delta) {
	c.State.mu.Lock()
	defer c.State.mu.Unlock()

	for _, mod := range mods {
		mod(r, c)
	}
}

// NewClient makes a new client
func NewClient() *Client {
	return &Client{
		ID:    rand.Text(),
		State: newClientState(),
	}
}

// ClientStore is my way of tracking multiple clients server side
type ClientStore struct {
	mu      *sync.Mutex
	cap     int
	clients []*Client
}

// NewClientStore provides a the client store with good cap
func NewClientStore(cap int) *ClientStore {
	return &ClientStore{
		mu:      &sync.Mutex{},
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

func (store *ClientStore) resume(w http.ResponseWriter, r *http.Request) *Client {
	var (
		cookie, cookieErr = r.Cookie(string(_cid))
		client            *Client
	)

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
		client = NewClient()
		store.preserve(client)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     string(_cid),
		Value:    client.ID,
		Expires:  time.Now().Add(ClientTTL),
		SameSite: http.SameSiteLaxMode,
		HttpOnly: true,
		Path:     "/",
	})

	return client
}

// EnsureClient is a middleware to get or create a client to state storage
// and client is stored in request context so the fish on catch fn
// can handle have access to the client
func (store *ClientStore) EnsureClient() func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			client := store.resume(w, r)
			ctx := context.WithValue(r.Context(), _cid, client)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// Download allows downloading the generated as a zip
func (store *ClientStore) Download() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		s := r.FormValue("download")

		client := store.resume(w, r)

		schemas := strparse.Raw(client.State.Input.Q)

		if len(s) == 0 {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

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
