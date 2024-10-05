import { CodeGenerator } from '../../core/structure';

export class GoMiddleware extends CodeGenerator {
        Run() {
                this.output = {
                        // ? had issues with route matching
                        '/internal/middleware/method_override.go': GoMiddleware.methodSwap,
                        // '/internal/middleware/example.go': GoMiddleware.example,
                };
                return this;
        }

        //         private static readonly example = `package middleware

        // import (
        //     "net/http"
        // )

        // func Example(next http.Handler) http.Handler {
        //     return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        //         next.ServeHTTP(w, r)
        //     })
        // }`;

        private static readonly methodSwap = `package middleware

import (
    "net/http"
    "strings"
)

// used to take form POST requests intended for edit and delete and convert their method appropriately
func MethodOverride(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if r.Method == http.MethodPost && r.Header.Get("Content-Type") == "application/x-www-form-urlencoded" {
            if err := r.ParseForm(); err != nil {
                http.Error(w, "Error parsing form data: "+err.Error(), http.StatusBadRequest)
                return
            }

            if method := r.FormValue("_method"); method != "" {
                // log.Printf("Overriding request method to: %s", strings.ToUpper(method))
                r.Method = strings.ToUpper(method)
            }
        }

        next.ServeHTTP(w, r)
    })
}`;
}
