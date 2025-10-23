package site

// Client is my way of tracking state server side
type Client struct {
	ID string
}

// ClientStore is my way of tracking multiple clients server side
type ClientStore struct {
	clients []Client
}

// DefaultClientStore is a reasonable starting point for client store
func DefaultClientStore() ClientStore {
	return ClientStore{
		clients: make([]Client, 0, 100),
	}
}
