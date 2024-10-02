import { alignKeyword, alignKeywords } from '../core/formatting';
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
                let repositories: string[] = [];

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
                                if (!table.endpoints.goShow) {
                                        console.error('what?! no show on router gen for table');
                                        continue;
                                }
                                let u = table.endpoints.goShow;
                                repositories.push(`${u.repo.var} := &repositories.${u.repo.type}{DB: db}`);

                                if (table.endpoints.create) {
                                        for (const endpoint of table.endpoints.create) {
                                                routes.push(
                                                        `r.HandleFunc("${endpoint.path + '/new'}", ${table.goPackageName}.${
                                                                endpoint.routerFuncName
                                                        }).Methods("${HttpMethod.GET}")`
                                                );
                                                routes.push(
                                                        `r.HandleFunc("/api${endpoint.path}", ${table.goPackageName}.${endpoint.routerFuncApiName}(${u.repo.var})).Methods("${endpoint.method}")`
                                                );
                                        }
                                }
                                if (table.endpoints.read) {
                                        for (const endpoint of table.endpoints.read) {
                                                routes.push(
                                                        `r.HandleFunc("${endpoint.path}", ${table.goPackageName}.${endpoint.routerFuncName}(${u.repo.var})).Methods("${HttpMethod.GET}")`
                                                );
                                                routes.push(
                                                        `r.HandleFunc("/api${endpoint.path}", ${table.goPackageName}.${endpoint.routerFuncApiName}(${u.repo.var})).Methods("${endpoint.method}")`
                                                );
                                        }
                                }
                                if (table.endpoints.update) {
                                        for (const endpoint of table.endpoints.update) {
                                                routes.push(
                                                        `r.HandleFunc("${endpoint.path + '/edit'}", ${table.goPackageName}.${endpoint.routerFuncName}(${
                                                                u.repo.var
                                                        })).Methods("${HttpMethod.GET}")`
                                                );
                                                routes.push(
                                                        `r.HandleFunc("/api${endpoint.path}", ${table.goPackageName}.${endpoint.routerFuncApiName}(${u.repo.var})).Methods("${endpoint.method}")`
                                                );
                                        }
                                }
                                if (table.endpoints.delete) {
                                        for (const endpoint of table.endpoints.delete) {
                                                // no delete view
                                                // routes.push(
                                                //         `r.HandleFunc("${endpoint.path}", ${table.goPackageName}.${endpoint.routerFuncName}(${u.repo.var})).Methods("${HttpMethod.GET}")`
                                                // );
                                                routes.push(
                                                        `r.HandleFunc("/api${endpoint.path}", ${table.goPackageName}.${endpoint.routerFuncApiName}(${u.repo.var})).Methods("${endpoint.method}")`
                                                );
                                        }
                                }
                        }
                }

                let allPackages: string[] = [];
                for (const key in schemas) {
                        if (!Object.prototype.hasOwnProperty.call(schemas, key)) {
                                continue;
                        }
                        const schema = schemas[key];

                        for (const key2 in schema.tables) {
                                if (Object.prototype.hasOwnProperty.call(schema.tables, key2)) {
                                        const table = schema.tables[key2];
                                        allPackages.push(table.goPackageName);
                                }
                        }
                }

                let routeStr = alignKeyword(
                        alignKeywords(
                                alignKeyword(routes, ' r.'),
                                allPackages.map((e) => ' ' + e + '.')
                        ),
                        ').Methods'
                )
                        .sort((a, b) => a.localeCompare(b))
                        .join('\n    ');
                let repositoriesStr = alignKeyword(repositories, ' :=')
                        .sort((a, b) => a.localeCompare(b))
                        .join('\n    ');

                let imports = allPackages.map((e) => `"myapp/internal/handlers/${e}"`).join('\n    ');

                let str = `package routes

import (
    "database/sql"
    "myapp/internal/middleware"
    "myapp/pkg/repositories"
    "net/http"
    "path/filepath"

    ${imports}    

    "github.com/gorilla/mux"
    _ "github.com/lib/pq"
)

func SetupRoutes(r *mux.Router, db *sql.DB) {
    ${repositoriesStr}

    r.Use(middleware.MethodOverrideMiddleware)
    r.HandleFunc("/assets/{filename}", serveAsset).Methods("GET")

    ${routeStr}
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
