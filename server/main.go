package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

const cacheDuration = 3600 * 24 // 1 hour
const publicDir = "./public"    // Change this to your actual path

var mimeTypes = map[string]string{
	".html": "text/html",
	".css":  "text/css",
	".txt":  "text/plain",
	".js":   "application/javascript",
	".png":  "image/png",
	".svg":  "image/svg+xml",
	".ico":  "image/x-icon",
}

func getExpireDateString() string {
	expiry := time.Now().Add(time.Duration(cacheDuration) * time.Second)
	return expiry.UTC().Format(time.RFC1123)
}

func handler(w http.ResponseWriter, r *http.Request) {
	// Get the requested file path, default to "index.html"
	filePath := filepath.Join(publicDir, r.URL.Path)
	if filePath == filepath.Join(publicDir, "/") {
		filePath = filepath.Join(publicDir, "index.html")
	}

	// Check if the file exists
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		http.Error(w, "404 Not Found", http.StatusNotFound)
		return
	}

	// If it's a directory, serve "index.html"
	if fileInfo.IsDir() {
		filePath = filepath.Join(filePath, "index.html")
	}

	// Read the file content
	content, err := os.ReadFile(filePath)
	if err != nil {
		http.Error(w, "500 Internal Server Error", http.StatusInternalServerError)
		return
	}

	// Get the file extension and its corresponding content type
	extname := filepath.Ext(filePath)
	contentType, ok := mimeTypes[extname]
	if !ok {
		contentType = "application/octet-stream"
	}

	// Set the headers
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d", cacheDuration))
	w.Header().Set("Expires", getExpireDateString())

	// Write the content to the response
	w.WriteHeader(http.StatusOK)
	w.Write(content)
}

func main() {
	// Serve the content with the handler function
	http.HandleFunc("/", handler)

	port := 1313
	fmt.Printf("Server is running at http://localhost:%d\n", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
