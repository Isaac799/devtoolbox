package site

import (
	"net/http"
	"strconv"
)

// delta is how we change a client based on a request
type delta = func(*http.Request, *Client)

var deltaQ = delta(func(r *http.Request, c *Client) {
	const k = "q"
	_, exists := r.Form[k]
	if !exists {
		return
	}

	c.Input.Q = r.FormValue(k)
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

	c.Input.Mode = mode
})

var deltaExample = delta(func(r *http.Request, c *Client) {
	const k = "example"
	_, exists := r.Form[k]
	if !exists {
		return
	}

	c.Input.Q = r.FormValue(k)
})

var deltaFocus = delta(func(r *http.Request, c *Client) {
	const k = "focus"
	_, exists := r.Form[k]
	if !exists {
		return
	}

	c.Input.Focus.Path = r.FormValue(k)
})
