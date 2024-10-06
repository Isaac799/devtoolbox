import { alignKeyword, organizePathObjectByKeys, SnakeToPascal } from '../../core/formatting';
import { CodeGenerator, EndpointParam, HttpMethod } from '../../core/structure';

type GroupedRoute = {
        [path: string]: Array<{
                method: HttpMethod;
                handlerFunc: string;
        }>;
};

export class GoRouter extends CodeGenerator {
        Run() {
                this.output = {
                        '/internal/routes/routes.go': this.GenerateRouter(),
                };
                return this;
        }

        GenerateRouter(): string {
                let routes: GroupedRoute = {};
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
                                        let _routes = `${endpoint.url.forRouter}/new`;
                                        if (!routes[_routes]) {
                                                routes[_routes] = [];
                                        }
                                        routes[_routes].push({
                                                method: HttpMethod.GET,
                                                handlerFunc: `${table.goPackageName}.${endpoint.go.routerFuncName}(nil)`,
                                        });

                                        _routes = `/api${endpoint.url.forRouter}`;
                                        if (!routes[_routes]) {
                                                routes[_routes] = [];
                                        }
                                        routes[_routes].push({
                                                method: endpoint.method,
                                                handlerFunc: `${table.goPackageName}.${endpoint.go.routerFuncApiName}(${repo.var})`,
                                        });

                                        _routes = `${endpoint.url.forRouter}`;
                                        if (!routes[_routes]) {
                                                routes[_routes] = [];
                                        }
                                        routes[_routes].push({
                                                method: endpoint.method,
                                                handlerFunc: `${table.goPackageName}.${endpoint.go.routerFuncFormName}(${repo.var})`,
                                        });
                                }
                                {
                                        let endpoint = table.endpoints.update.single;

                                        let _routes = `${endpoint.url.forRouter}/edit`;
                                        if (!routes[_routes]) {
                                                routes[_routes] = [];
                                        }
                                        routes[_routes].push({
                                                method: HttpMethod.GET,
                                                // nil param is the changeset
                                                handlerFunc: `${table.goPackageName}.${endpoint.go.routerFuncName}(${repo.var}, nil)`,
                                        });

                                        _routes = `/api${endpoint.url.forRouter}`;
                                        if (!routes[_routes]) {
                                                routes[_routes] = [];
                                        }
                                        routes[_routes].push({
                                                method: endpoint.method,
                                                handlerFunc: `${table.goPackageName}.${endpoint.go.routerFuncApiName}(${repo.var})`,
                                        });

                                        _routes = `${endpoint.url.forRouter}`;
                                        if (!routes[_routes]) {
                                                routes[_routes] = [];
                                        }
                                        routes[_routes].push({
                                                method: endpoint.method,
                                                handlerFunc: `${table.goPackageName}.${endpoint.go.routerFuncFormName}(${repo.var})`,
                                        });
                                }
                                {
                                        let endpoint = table.endpoints.delete.single;

                                        // no delete view

                                        let _routes = `/api${endpoint.url.forRouter}`;
                                        if (!routes[_routes]) {
                                                routes[_routes] = [];
                                        }
                                        routes[_routes].push({
                                                method: endpoint.method,
                                                handlerFunc: `${table.goPackageName}.${endpoint.go.routerFuncApiName}(${repo.var})`,
                                        });

                                        _routes = `${endpoint.url.forRouter}`;
                                        if (!routes[_routes]) {
                                                routes[_routes] = [];
                                        }
                                        routes[_routes].push({
                                                method: endpoint.method,
                                                handlerFunc: `${table.goPackageName}.${endpoint.go.routerFuncFormName}(${repo.var})`,
                                        });
                                }

                                // * important that read is last as it will match before the edit and delete

                                {
                                        let endpoint = table.endpoints.read.single;

                                        let _routes = `${endpoint.url.forRouter}`;
                                        if (!routes[_routes]) {
                                                routes[_routes] = [];
                                        }
                                        routes[_routes].push({
                                                method: HttpMethod.GET,
                                                handlerFunc: `${table.goPackageName}.${endpoint.go.routerFuncName}(${repo.var})`,
                                        });

                                        _routes = `/api${endpoint.url.forRouter}`;
                                        if (!routes[_routes]) {
                                                routes[_routes] = [];
                                        }
                                        routes[_routes].push({
                                                method: endpoint.method,
                                                handlerFunc: `${table.goPackageName}.${endpoint.go.routerFuncApiName}(${repo.var})`,
                                        });
                                }
                                {
                                        let endpoint = table.endpoints.read.many;

                                        let _routes = `${endpoint.url.forRouter}`;
                                        if (!routes[_routes]) {
                                                routes[_routes] = [];
                                        }
                                        routes[_routes].push({
                                                method: HttpMethod.GET,
                                                handlerFunc: `${table.goPackageName}.${endpoint.go.routerFuncName}(${repo.var})`,
                                        });

                                        _routes = `/api${endpoint.url.forRouter}`;
                                        if (!routes[_routes]) {
                                                routes[_routes] = [];
                                        }
                                        routes[_routes].push({
                                                method: endpoint.method,
                                                handlerFunc: `${table.goPackageName}.${endpoint.go.routerFuncApiName}(${repo.var})`,
                                        });
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

                // console.log(routes);
                let routeStrs = [];

                routes = organizePathObjectByKeys(routes);

                for (const key in routes) {
                        if (Object.prototype.hasOwnProperty.call(routes, key)) {
                                const route = routes[key];
                                let cases = [];
                                for (const kind of route) {
                                        let caseStr = `case http.Method${SnakeToPascal(kind.method.toLocaleLowerCase())}`;
                                        cases.push(`    ${caseStr}: ${kind.handlerFunc}(w, r) `);
                                }

                                let wrapper = `    mux.HandleFunc("${key}", func(w http.ResponseWriter, r *http.Request) {
        switch r.Method {
        ${cases.join('\n    ')}
        default:
            http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        }
    })`;
                                routeStrs.push(wrapper);
                                // console.log(wrapper);
                        }
                }

                let finalRouteStrs = routeStrs.join('\n');

                let repositoriesStr = alignKeyword(repositories, ' :=').join('\n    ');

                let imports = allPackages.map((e) => `"myapp/internal/handlers/${e}"`).join('\n    ');

                let str = `package routes

import (
    "database/sql"
    "myapp/pkg/repositories"
    "net/http"
    "path/filepath"
    "myapp/internal/middleware"
    "myapp/internal/handlers/page"

    ${imports}    

    _ "github.com/lib/pq"
)

func SetupRoutes(serverMux *http.ServeMux, db *sql.DB) {
    ${repositoriesStr}

    mux := http.NewServeMux()

    // Makes all requests run through this middleware
    serverMux.Handle("/", middleware.MethodOverride(mux))

    mux.HandleFunc("/assets/{filename}", serveAsset)
    mux.HandleFunc("/404", page.Error404Page())
    mux.HandleFunc("/500", page.Error500Page())
    mux.HandleFunc("/", page.HomePage())

${finalRouteStrs}
}

func serveAsset(w http.ResponseWriter, r *http.Request) {
    filename := r.PathValue("filename")
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
                        .map((e) =>
                                e.go.var.propertyGoType === 'string'
                                        ? `${e.go.var.propertyAsVariable} :=  r.PathValue("${e.go.var.propertyAsVariable}")`
                                        : `${e.go.var.propertyAsVariable}Str :=  r.PathValue("${e.go.var.propertyAsVariable}")
    ${e.go.var.propertyAsVariable}, err := ${e.go.stuff.parseFunction(`${e.go.var.propertyAsVariable}Str`)}
       if err != nil {
       http.Error(w, "Invalid ${e.sql.name}", http.StatusBadRequest)
       return
    }`
                        )
                        .join('\n\n    ');
        }

        static GenerateImports(value: EndpointParam[], includeReadonly: boolean, includeSystem: boolean) {
                let input = [...value];
                if (!includeReadonly) {
                        input = input.filter((e) => !e.readOnly);
                }
                if (!includeSystem) {
                        input = input.filter((e) => !e.systemField);
                }
                // input = input.filter((e) => !e.systemField);
                let imports = input.map((e) => e.go.stuff.importPackageForConversion);
                return imports;
        }
        static GenerateImportsFormStruct(value: EndpointParam[]) {
                let imports = value.map((e) => e.go.stuff.importPackageForStruct);
                return imports;
        }
}
