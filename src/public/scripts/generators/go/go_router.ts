import { alignKeyword, alignKeywords } from '../../core/formatting';
import { CodeGenerator, EndpointParam, HttpMethod } from '../../core/structure';

export class GoRouter extends CodeGenerator {
        Run() {
                this.output = {
                        '/internal/routes/routes.go': this.GenerateRouter(),
                };
                return this;
        }

        GenerateRouter(): string {
                let routes: string[] = [];
                let routesApi: string[] = [];
                let routesForm: string[] = [];
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
                                if (!table.endpoints) {
                                        continue;
                                }
                                // for the repo any endpoint will do
                                let repo = table.endpoints.read.single.repo;

                                repositories.push(`${repo.var} := &repositories.${repo.type}{DB: db}`);

                                {
                                        let endpoint = table.endpoints.create.single;
                                        routes.push(
                                                `r.HandleFunc("${endpoint.url.forRouter + '/new'}", ${table.goPackageName}.${
                                                        endpoint.go.routerFuncName
                                                }).Methods("${HttpMethod.GET}")`
                                        );
                                        routesApi.push(
                                                `r.HandleFunc("/api${endpoint.url.forRouter}", ${table.goPackageName}.${endpoint.go.routerFuncApiName}(${repo.var})).Methods("${endpoint.method}")`
                                        );

                                        routesForm.push(
                                                `r.HandleFunc("${endpoint.url.forRouter}", ${table.goPackageName}.${endpoint.go.routerFuncFormName}(${repo.var})).Methods("POST")`
                                        );
                                }
                                {
                                        let endpoint = table.endpoints.update.single;
                                        routes.push(
                                                `r.HandleFunc("${endpoint.url.forRouter + '/edit'}", ${table.goPackageName}.${endpoint.go.routerFuncName}(${
                                                        repo.var
                                                })).Methods("${HttpMethod.GET}")`
                                        );
                                        routesApi.push(
                                                `r.HandleFunc("/api${endpoint.url.forRouter}", ${table.goPackageName}.${endpoint.go.routerFuncApiName}(${repo.var})).Methods("${endpoint.method}")`
                                        );

                                        routesForm.push(
                                                // `r.HandleFunc("${endpoint.path}", ${table.goPackageName}.${endpoint.routerFuncFormName}(${repo.var})).Methods("PUT")`
                                                `r.HandleFunc("${endpoint.url.forRouter}/update", ${table.goPackageName}.${endpoint.go.routerFuncFormName}(${repo.var})).Methods("POST")`
                                        );
                                }
                                {
                                        let endpoint = table.endpoints.delete.single;
                                        // no delete view
                                        // routes.push(
                                        //         `r.HandleFunc("${endpoint.path}", ${table.goPackageName}.${endpoint.go.routerFuncName}(${repo.var})).Methods("${HttpMethod.GET}")`
                                        // );
                                        routesApi.push(
                                                `r.HandleFunc("/api${endpoint.url.forRouter}", ${table.goPackageName}.${endpoint.go.routerFuncApiName}(${repo.var})).Methods("${endpoint.method}")`
                                        );

                                        routesForm.push(
                                                // `r.HandleFunc("${endpoint.path}", ${table.goPackageName}.${endpoint.routerFuncFormName}(${repo.var})).Methods("DELETE")`
                                                `r.HandleFunc("${endpoint.url.forRouter}/delete", ${table.goPackageName}.${endpoint.go.routerFuncFormName}(${repo.var})).Methods("POST")`
                                        );
                                }

                                // * important that read is last as it will match before the edit and delete

                                {
                                        let endpoint = table.endpoints.read.single;
                                        routes.push(
                                                `r.HandleFunc("${endpoint.url.forRouter}", ${table.goPackageName}.${endpoint.go.routerFuncName}(${repo.var})).Methods("${HttpMethod.GET}")`
                                        );
                                        routesApi.push(
                                                `r.HandleFunc("/api${endpoint.url.forRouter}", ${table.goPackageName}.${endpoint.go.routerFuncApiName}(${repo.var})).Methods("${endpoint.method}")`
                                        );
                                }
                                {
                                        let endpoint = table.endpoints.read.many;
                                        routes.push(
                                                `r.HandleFunc("${endpoint.url.forRouter}", ${table.goPackageName}.${endpoint.go.routerFuncName}(${repo.var})).Methods("${HttpMethod.GET}")`
                                        );
                                        routesApi.push(
                                                `r.HandleFunc("/api${endpoint.url.forRouter}", ${table.goPackageName}.${endpoint.go.routerFuncApiName}(${repo.var})).Methods("${endpoint.method}")`
                                        );
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
                                        if (table.hasCompositePrimaryKey()) continue;
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
                ).join('\n    ');

                let routeApiStr = alignKeyword(
                        alignKeywords(
                                alignKeyword(routesApi, ' r.'),
                                allPackages.map((e) => ' ' + e + '.')
                        ),
                        ').Methods'
                ).join('\n    ');

                let routesFormStr = alignKeyword(
                        alignKeywords(
                                alignKeyword(routesForm, ' r.'),
                                allPackages.map((e) => ' ' + e + '.')
                        ),
                        ').Methods'
                ).join('\n    ');

                let repositoriesStr = alignKeyword(repositories, ' :=').join('\n    ');

                let imports = allPackages.map((e) => `"myapp/internal/handlers/${e}"`).join('\n    ');

                let methodOverrideStr = ``;
                //                 let methodOverrideStr = `

                //     // note: a path to match must match for our form submission to run through
                //     //       the middleware for necessary method modification
                //     http.Handle("/", middleware.MethodOverride(r))`;

                //    "myapp/internal/middleware"
                let str = `package routes

import (
    "database/sql"
    "myapp/pkg/repositories"
    "net/http"
    "path/filepath"

    ${imports}    

    "github.com/gorilla/mux"
    _ "github.com/lib/pq"
)

func SetupRoutes(r *mux.Router, db *sql.DB) {
    ${repositoriesStr}

    r.HandleFunc("/assets/{filename}", serveAsset).Methods("GET")

    ${routeStr}

    ${routesFormStr}

    ${routeApiStr}
    ${methodOverrideStr}
}

func serveAsset(w http.ResponseWriter, r *http.Request) {
    filename := mux.Vars(r)["filename"]
    path := filepath.Join("../../web/static", filename)

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
                                        e.go.var.propertyGoType === 'string'
                                                ? `    vars := mux.Vars(r)
    ${e.go.var.propertyAsVariable} := vars["${e.go.var.propertyAsVariable}"]`
                                                : `    vars := mux.Vars(r)
    ${e.go.var.propertyAsVariable}Str := vars["${e.go.var.propertyAsVariable}"] 
    ${e.go.var.propertyAsVariable}, err := ${e.go.stuff.parseFunction(`${e.go.var.propertyAsVariable}Str`)}
       if err != nil {
       http.Error(w, "Invalid ${e.sql.name}", http.StatusBadRequest)
       return
    }`

                                //     `${e.go.var.varName}Str := r.URL.Query().Get("${e.sql.name}")
                                //     ${e.go.var.varName}, err := ${e.go.parser(`${e.go.var.varName}Str`)}
                                //         if err != nil {
                                //         http.Error(w, "Invalid ${e.sql.name}", http.StatusBadRequest)
                                //         return
                                //     }`
                        )
                        .join('\n\n    ');
        }

        static GenerateImports(value: EndpointParam[], includeReadonly: boolean) {
                let input = [...value];
                if (!includeReadonly) {
                        input = input.filter((e) => !e.readOnly);
                }
                let imports = input.map((e) => e.go.stuff.importPackageForConversion);
                return imports;
        }
        static GenerateImportsFormStruct(value: EndpointParam[]) {
                let imports = value.map((e) => e.go.stuff.importPackageForStruct);
                return imports;
        }
}
