package models

type ClientData struct {
	ClientID      uint32 `json:"clientId"`
	UserAgent     string `json:"userAgent"`
	ScreenWidth   int    `json:"screenWidth"`
	ScreenHeight  int    `json:"screenHeight"`
	ColorDepth    int    `json:"colorDepth"`
	TimeZone      string `json:"timeZone"`
	Language      string `json:"language"`
	IsTouchDevice bool   `json:"isTouchDevice"`
}
