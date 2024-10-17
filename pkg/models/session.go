package models

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type Session struct {
	ID          string
	ExpiresAt   time.Time
	HTTPVersion string
	Host        string
	UserAgent   string
}

type SessionStore struct {
	db *sql.DB
}

const SessionDuration = 24 * time.Hour

func NewSessionStore(dataSourceName string) (*SessionStore, error) {
	db, err := sql.Open("sqlite3", dataSourceName)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := createSessionsTable(db); err != nil {
		return nil, err
	}

	return &SessionStore{db: db}, nil
}

func createSessionsTable(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			expires_at DATETIME,
			http_version TEXT,
			host TEXT,
			user_agent TEXT
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create sessions table: %w", err)
	}
	return nil
}

func (s *SessionStore) CreateSession(id, httpVersion, host, userAgent string) (*Session, error) {
	if err := s.CleanupExpiredSessions(); err != nil {
		return nil, fmt.Errorf("cleanup expired sessions failed: %w", err)
	}

	session := &Session{
		ID:          id,
		ExpiresAt:   time.Now().Add(SessionDuration),
		HTTPVersion: httpVersion,
		Host:        host,
		UserAgent:   userAgent,
	}

	if err := s.insertSession(session); err != nil {
		return nil, err
	}

	return session, nil
}

func (s *SessionStore) insertSession(session *Session) error {
	stmt, err := s.db.Prepare("INSERT INTO sessions (id, expires_at, http_version, host, user_agent) VALUES (?, ?, ?, ?, ?)")
	if err != nil {
		return fmt.Errorf("prepare statement failed: %w", err)
	}
	defer stmt.Close()

	_, err = stmt.Exec(session.ID, session.ExpiresAt.Format(time.RFC3339), session.HTTPVersion, session.Host, session.UserAgent)
	if err != nil {
		return fmt.Errorf("failed to insert session: %w", err)
	}

	return nil
}

func (s *SessionStore) GetSession(id string) (*Session, error) {
	session := &Session{}
	row := s.db.QueryRow("SELECT id, expires_at, http_version, host, user_agent FROM sessions WHERE id = ?", id)

	if err := row.Scan(&session.ID, &session.ExpiresAt, &session.HTTPVersion, &session.Host, &session.UserAgent); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Session not found
		}
		return nil, fmt.Errorf("failed to retrieve session: %w", err)
	}

	if time.Now().After(session.ExpiresAt) {
		return nil, nil // Session expired
	}

	return session, nil
}

func (s *SessionStore) RefreshSession(id string) error {
	newExpiry := time.Now().Add(SessionDuration)
	return s.updateSessionExpiry(id, newExpiry)
}

func (s *SessionStore) updateSessionExpiry(id string, newExpiry time.Time) error {
	stmt, err := s.db.Prepare("UPDATE sessions SET expires_at = ? WHERE id = ?")
	if err != nil {
		return fmt.Errorf("prepare statement failed: %w", err)
	}
	defer stmt.Close()

	if _, err = stmt.Exec(newExpiry.Format(time.RFC3339), id); err != nil {
		return fmt.Errorf("failed to refresh session: %w", err)
	}

	return nil
}

func (s *SessionStore) CleanupExpiredSessions() error {
	_, err := s.db.Exec("DELETE FROM sessions WHERE expires_at < ?", time.Now().Format(time.RFC3339))
	return err
}

func (s *SessionStore) DeleteSession(id string) error {
	stmt, err := s.db.Prepare("DELETE FROM sessions WHERE id = ?")
	if err != nil {
		return fmt.Errorf("prepare statement failed: %w", err)
	}
	defer stmt.Close()

	if _, err = stmt.Exec(id); err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}

	return nil
}

func (s *SessionStore) Close() error {
	if err := s.db.Close(); err != nil {
		return fmt.Errorf("failed to close database: %w", err)
	}
	return nil
}
