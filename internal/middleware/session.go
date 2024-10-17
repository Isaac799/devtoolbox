package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"log"
	"net/http"
	"time"

	"devtoolbox.org/pkg/models"
)

func Session(store *models.SessionStore) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			sessionCookie, err := r.Cookie("session_id")
			sessionID := ""

			if err != nil || sessionCookie == nil {
				sessionID, err = createNewSession(store, w, r)
				if err != nil {
					http.Error(w, "Could not create session", http.StatusInternalServerError)
					return
				}
			} else {
				sessionID = sessionCookie.Value
				if _, err := store.GetSession(sessionID); err != nil {
					log.Print(err)
					http.Error(w, "Invalid session", http.StatusUnauthorized)
					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

func createNewSession(store *models.SessionStore, w http.ResponseWriter, r *http.Request) (string, error) {
	newSessionID, err := generateSessionID()
	if err != nil {
		return "", err
	}

	httpVersion := r.Proto
	host := r.Host
	userAgent := r.UserAgent()

	if _, err := store.CreateSession(newSessionID, httpVersion, host, userAgent); err != nil {
		return "", err
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    newSessionID,
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})

	return newSessionID, nil
}

func generateSessionID() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}
