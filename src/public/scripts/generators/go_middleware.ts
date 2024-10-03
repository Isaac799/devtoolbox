import { CodeGenerator } from '../core/structure';

export class GoMiddleware extends CodeGenerator {
        Run() {
                this.output = {
                        // ? had issues with route matching
                        // '/internal/middleware/method_override.go': GoMiddleware.methodSwap,
                        '/internal/middleware/example.go': GoMiddleware.example,
                };
                return this;
        }

        private static readonly example = `package middleware

import (
    "net/http"
)

func Example(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        next.ServeHTTP(w, r)
    })
}`;

        // private static readonly methodSwap = `package middleware

        // import (
        //     "net/http"
        //     "strings"
        // )

        // func MethodOverride(next http.Handler) http.Handler {
        //     return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        //         if r.Method == http.MethodPost {
        //             if r.Header.Get("Content-Type") == "application/x-www-form-urlencoded" {
        //                 // Parse the form data
        //                 if err := r.ParseForm(); err == nil {
        //                     // Check for the _method parameter
        //                     if method := r.FormValue("_method"); method != "" {
        //                         // Override the request method
        //                         r.Method = strings.ToUpper(method)
        //                     }
        //                 }
        //             }
        //         }
        //         next.ServeHTTP(w, r)
        //     })
        // }`;
}
