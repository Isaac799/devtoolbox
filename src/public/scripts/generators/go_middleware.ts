import { CodeGenerator } from '../core/structure';

export class GoMiddleware extends CodeGenerator {
        Run() {
                this.output = {
                        '/internal/middleware/override_method.go': GoMiddleware.methodSwap,
                };
                return this;
        }

        private static readonly methodSwap = `package main

import (
    "net/http"
)

func MethodOverrideMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if r.Method == http.MethodPost {
            r.ParseForm()
            if newMethod := r.FormValue("_method"); newMethod != "" {
                r.Method = newMethod
            }
        }
        next.ServeHTTP(w, r)
    })
}
`;
}
