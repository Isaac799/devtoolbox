import { alignKeyword } from '../core/formatting';
import { CodeGenerator, EndpointParam, HttpMethod } from '../core/structure';

export class GoRouter extends CodeGenerator {
        Run() {
                this.output = {
                        '/internal/routes/routes.go': this.GenerateRouter(),
                };
                return this;
        }

        GenerateRouter(): string {
                let routes: string[] = [];

                let schemas = this.input;
                for (const schemaName in schemas) {
                        if (!Object.prototype.hasOwnProperty.call(schemas, schemaName)) {
                                continue;
                        }
                        const schema = schemas[schemaName];

                        for (const tableName in schema.tables) {
                                if (!Object.prototype.hasOwnProperty.call(schema.tables, tableName)) {
                                        continue;
                                }
                                const table = schema.tables[tableName];
                                if (table.endpoints.create) {
                                        for (const endpoint of table.endpoints.create) {
                                                routes.push(
                                                        `a.Router.HandleFunc("${endpoint.path + '/new'}", a.${endpoint.routerFuncName}).Methods("${
                                                                HttpMethod.GET
                                                        }")`
                                                );
                                                routes.push(
                                                        `a.Router.HandleFunc("/api${endpoint.path}", a.${endpoint.routerFuncApiName}).Methods("${endpoint.method}")`
                                                );
                                        }
                                }
                                if (table.endpoints.read) {
                                        for (const endpoint of table.endpoints.read) {
                                                routes.push(
                                                        `a.Router.HandleFunc("${endpoint.path}", a.${endpoint.routerFuncName}).Methods("${HttpMethod.GET}")`
                                                );
                                                routes.push(
                                                        `a.Router.HandleFunc("/api${endpoint.path}", a.${endpoint.routerFuncApiName}).Methods("${endpoint.method}")`
                                                );
                                        }
                                }
                                if (table.endpoints.update) {
                                        for (const endpoint of table.endpoints.update) {
                                                routes.push(
                                                        `a.Router.HandleFunc("${endpoint.path}", a.${endpoint.routerFuncName}).Methods("${HttpMethod.GET}")`
                                                );
                                                routes.push(
                                                        `a.Router.HandleFunc("/api${endpoint.path}", a.${endpoint.routerFuncApiName}).Methods("${endpoint.method}")`
                                                );
                                        }
                                }
                                if (table.endpoints.delete) {
                                        for (const endpoint of table.endpoints.delete) {
                                                routes.push(
                                                        `a.Router.HandleFunc("${endpoint.path}", a.${endpoint.routerFuncName}).Methods("${HttpMethod.GET}")`
                                                );
                                                routes.push(
                                                        `a.Router.HandleFunc("/api${endpoint.path}", a.${endpoint.routerFuncApiName}).Methods("${endpoint.method}")`
                                                );
                                        }
                                }
                        }
                }

                let routeStr = alignKeyword(alignKeyword(routes, ' a.'), ').M')
                        .sort((a, b) => a.localeCompare(b))
                        .join('\n    ');

                let str = `package main

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"

    "github.com/gorilla/mux"
    _ "github.com/lib/pq"
)

func (a *App) InitializeRoutes() {
    a.Router.Use(MethodOverrideMiddleware)

    ${routeStr}

    a.Router.HandleFunc("/assets/{filename}", serveAsset).Methods("GET")
}

func serveAsset(w http.ResponseWriter, r *http.Request) {
    filename := mux.Vars(r)["filename"]
    path := filepath.Join("assets", filename)

    contentType := "text/plain"

    switch filepath.Ext(path) {
    case ".css":
        contentType = "text/css"
    case ".png":
        contentType = "image/png"
    case ".jpg", ".jpeg":
        contentType = "image/jpeg"
    case ".gif":
        contentType = "image/gif"
    case ".svg":
        contentType = "image/svg+xml"
    case ".ico":
        contentType = "image/x-icon"
    case ".js":
        contentType = "application/javascript"
    }

    w.Header().Set("Content-Type", contentType)
    w.Header().Set("Cache-Control", "public, max-age=3600") // 1 hour cache
    http.ServeFile(w, r, path)
}`;

                // Note that these *Segment function can be more generic, but is done this
                // way for easier parsing into the correct type

                return str;
        }

        static ParseFromPath(value: EndpointParam[]) {
                return value
                        .map(
                                (e) =>
                                        e.go.typeType === 'string'
                                                ? `    vars := mux.Vars(r)
    ${e.go.varName} := vars["${e.go.varName}"]`
                                                : `    vars := mux.Vars(r)
    ${e.go.varName}Str := vars["${e.go.varName}"] 
    ${e.go.varName}, err := ${e.go.parser(`${e.go.varName}Str`)}
       if err != nil {
       http.Error(w, "Invalid ${e.sql.name}", http.StatusBadRequest)
       return
    }`

                                //     `${e.go.varName}Str := r.URL.Query().Get("${e.sql.name}")
                                //     ${e.go.varName}, err := ${e.go.parser(`${e.go.varName}Str`)}
                                //         if err != nil {
                                //         http.Error(w, "Invalid ${e.sql.name}", http.StatusBadRequest)
                                //         return
                                //     }`
                        )
                        .join('\n\n    ');
        }
}
