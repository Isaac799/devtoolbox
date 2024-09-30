import { CodeGenerator, EndpointParam, HttpMethod } from '../core/structure';

export class GoSsrRouter extends CodeGenerator {
        Run() {
                this.output = {
                        'router.go': this.GenerateRouter(),
                };
                return this;
        }

        GenerateRouter(): string {
                let tableRoutes: {
                        funcName: string;
                        path: string;
                        method: HttpMethod;
                }[] = [];
                let tableRoutesWithPrefix: {
                        path: string;
                        method: HttpMethod;
                        options: {
                                funcName: string;
                                segmentFuncName: string;
                                paramInfo: EndpointParam;
                        }[];
                }[] = [];

                let tableRoutesWithPrefixApi: {
                        path: string;
                        options: {
                                funcName: string;
                                method: HttpMethod;
                        }[];
                }[] = [];

                let apiParseIdFrom: EndpointParam;

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
                                                tableRoutes.push({
                                                        funcName: endpoint.routerFuncName,
                                                        path: endpoint.url + '/new',
                                                        method: HttpMethod.GET,
                                                });
                                                tableRoutesWithPrefixApi.push({
                                                        path: '/api' + endpoint.url,
                                                        options: [
                                                                {
                                                                        funcName: endpoint.routerFuncApiName,
                                                                        method: HttpMethod.POST,
                                                                },
                                                        ],
                                                });
                                        }
                                }

                                if (table.endpoints.read) {
                                        for (const endpoint of table.endpoints.read) {
                                                if (endpoint.many) {
                                                        tableRoutes.push({
                                                                funcName: endpoint.routerFuncName,
                                                                path: endpoint.url,
                                                                method: HttpMethod.GET,
                                                        });

                                                        let indexOfApi = tableRoutesWithPrefixApi.findIndex((e) => e.path === '/api' + endpoint.url);
                                                        if (indexOfApi === -1) {
                                                                tableRoutesWithPrefixApi.push({
                                                                        path: '/api' + endpoint.url,
                                                                        options: [
                                                                                {
                                                                                        funcName: endpoint.routerFuncApiName,
                                                                                        method: HttpMethod.GET,
                                                                                },
                                                                        ],
                                                                });
                                                        } else {
                                                                tableRoutesWithPrefixApi[indexOfApi].options.push({
                                                                        funcName: endpoint.routerFuncApiName,
                                                                        method: HttpMethod.GET,
                                                                });
                                                        }

                                                        apiParseIdFrom = endpoint.primaryKeyEndpointParam;
                                                } else {
                                                        let indexOf = tableRoutesWithPrefix.findIndex((e) => e.path === endpoint.url);
                                                        if (indexOf === -1) {
                                                                tableRoutesWithPrefix.push({
                                                                        path: endpoint.url,
                                                                        method: HttpMethod.GET,
                                                                        options: [
                                                                                {
                                                                                        funcName: endpoint.routerFuncName,
                                                                                        segmentFuncName: endpoint.sqlTableName + 'EditOrShow',
                                                                                        paramInfo: endpoint.primaryKeyEndpointParam,
                                                                                },
                                                                        ],
                                                                });
                                                        } else {
                                                                tableRoutesWithPrefix[indexOf].options.push({
                                                                        funcName: endpoint.routerFuncName,
                                                                        segmentFuncName: endpoint.sqlTableName + 'EditOrShow',
                                                                        paramInfo: endpoint.primaryKeyEndpointParam,
                                                                });
                                                        }
                                                }
                                        }
                                }

                                if (table.endpoints.update) {
                                        for (const endpoint of table.endpoints.update) {
                                                let indexOfApi = tableRoutesWithPrefixApi.findIndex((e) => e.path === '/api' + endpoint.url);
                                                if (indexOfApi === -1) {
                                                        tableRoutesWithPrefixApi.push({
                                                                path: '/api' + endpoint.url,
                                                                options: [
                                                                        {
                                                                                funcName: endpoint.routerFuncApiName,
                                                                                method: HttpMethod.PUT,
                                                                        },
                                                                ],
                                                        });
                                                } else {
                                                        tableRoutesWithPrefixApi[indexOfApi].options.push({
                                                                funcName: endpoint.routerFuncApiName,
                                                                method: HttpMethod.PUT,
                                                        });
                                                }

                                                let indexOf = tableRoutesWithPrefix.findIndex((e) => e.path === endpoint.url);
                                                if (indexOf === -1) {
                                                        tableRoutesWithPrefix.push({
                                                                path: endpoint.url,
                                                                method: HttpMethod.GET,
                                                                options: [
                                                                        {
                                                                                funcName: endpoint.routerFuncName,
                                                                                segmentFuncName: endpoint.sqlTableName + 'EditOrShow',
                                                                                paramInfo: endpoint.primaryKeyEndpointParam,
                                                                        },
                                                                ],
                                                        });
                                                } else {
                                                        tableRoutesWithPrefix[indexOf].options.push({
                                                                funcName: endpoint.routerFuncName,
                                                                segmentFuncName: endpoint.sqlTableName + 'EditOrShow',
                                                                paramInfo: endpoint.primaryKeyEndpointParam,
                                                        });
                                                }
                                        }
                                }

                                // For the visual routes we don't need a delete
                                if (table.endpoints.delete) {
                                        for (const endpoint of table.endpoints.delete) {
                                                let indexOfApi = tableRoutesWithPrefixApi.findIndex((e) => e.path === '/api' + endpoint.url);
                                                if (indexOfApi === -1) {
                                                        tableRoutesWithPrefixApi.push({
                                                                path: '/api' + endpoint.url,
                                                                options: [
                                                                        {
                                                                                funcName: endpoint.routerFuncApiName,
                                                                                method: HttpMethod.DELETE,
                                                                        },
                                                                ],
                                                        });
                                                } else {
                                                        tableRoutesWithPrefixApi[indexOfApi].options.push({
                                                                funcName: endpoint.routerFuncApiName,
                                                                method: HttpMethod.DELETE,
                                                        });
                                                }
                                        }
                                }

                                // The read has the show covered
                                // if (!table.endpoints.goShow) {
                                //         console.error('missing go show file path when creating navigation bar');
                                //         continue;
                                // }
                                // tableRoutes.push({
                                //         funcName: table.endpoints.goShow.routerFuncName,
                                //         path: table.endpoints.goShow.url,
                                // });
                        }
                }

                let itemRoutes = tableRoutes
                        .map((e) => {
                                return `    case path == "${e.path}":
        ${e.funcName}(w, r)`;
                        })
                        .join('\n');

                let itemWithPrefixRoutes = tableRoutesWithPrefix
                        .map((e) => {
                                // const opts = e.options.map((o) => `${o.segmentFuncName}(w, r, strings.TrimPrefix(path, "${e.path}/"))`).join('\n        ');
                                const opts = `${e.options[0].segmentFuncName}(w, r, strings.TrimPrefix(path, "${e.path}/"))`;
                                return `    case strings.HasPrefix(path, "${e.path}/"):
        ${opts}`;
                        })
                        .join('\n');

                let itemRouteSegments = tableRoutesWithPrefix
                        .map((e) => {
                                return `func ${e.options[0].segmentFuncName}(w http.ResponseWriter, r *http.Request, segment string) {
    ${GoSsrRouter.ParseFromPath([e.options[0].paramInfo], true)}
    if strings.HasSuffix(segment, "/edit") {
        ${e.options[1].funcName}(w, r, ${e.options[0].paramInfo.go.varName})
    } else {
        ${e.options[0].funcName}(w, r, ${e.options[0].paramInfo.go.varName})
    }
}`;
                        })
                        .join('\n');

                let apiParseIdFrom2 = apiParseIdFrom!;
                let itemKeyParsedStr = `${GoSsrRouter.ParseFromPath([apiParseIdFrom2], false, true, tableRoutesWithPrefixApi[0].path + '/')}`;

                let itemRoutesApi2 = tableRoutesWithPrefixApi
                        .map((e) => {
                                let methodCases = e.options.map((r) => {
                                        return `case method == ${r.method}
            ${r.funcName}(w, r, ${apiParseIdFrom2.go.varName})`;
                                });

                                let pathMethodSwitch = `    switch {
        ${methodCases.join('\n        ')}
        }`;

                                let pathSwitch = `    switch {
    case strings.HasPrefix(path, "${e.path}"):
    ${pathMethodSwitch}
    default:
        http.NotFound(w, r)
    }`;

                                return pathSwitch;
                        })
                        .join('\n');

                //         let itemRoutesApi = tableRoutesApi
                //                 .map((e) => {
                //                         return `    case strings.HasPrefix(path, "${e.path}") && method == "${e.method}" :
                // ${e.funcName}(w, r, ${apiParseIdFrom2.go.varName})`;
                //                 })
                //                 .join('\n');

                let str = `package main

import (
    "net/http"
    "strconv"
    "strings"
)

func router(w http.ResponseWriter, r *http.Request) {
    path := r.URL.Path

    if strings.HasPrefix(path, "/api/") {
        handleApi(w, r)
        return
    }

    method := r.Method

    // Override POST method from edit and delete forms
    if method == http.MethodPost {
        r.ParseForm()
        if newMethod := r.FormValue("_method"); newMethod != "" {
            method = newMethod
        }
    }

    switch method {
    case http.MethodGet:
        handleGet(w, r)
    default:
        http.NotFound(w, r)
    }
}

func handleGet(w http.ResponseWriter, r *http.Request) {
    path := r.URL.Path

    switch {
    case path == "/":
        ShowHome(w, r)
    case strings.HasPrefix(path, "/assets/"):
        ServeAsset(w, r)
${itemRoutes}
${itemWithPrefixRoutes}
    default:
        http.NotFound(w, r)
    }
}

func handleApi(w http.ResponseWriter, r *http.Request) {
    method := r.Method

    ${itemKeyParsedStr}    


${itemRoutesApi2}

}

${itemRouteSegments}

func serveAsset(w http.ResponseWriter, r *http.Request) {
    path := filepath.Join("assets", r.URL.Path[len("/assets/"):])

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
    case ".icon":
       contentType = "image/x-icon"
    case ".js":
       contentType = "application/javascript"
    }

    w.Header().Set("Content-Type", contentType)
    w.Header().Set("Cache-Control", "public, max-age=3600") // Cache for 1 hour (3600 seconds)
    http.ServeFile(w, r, path)
}


`;

                // Note that these *Segment function can be more generic, but is done this
                // way for easier parsing into the correct type

                return str;
        }

        static ParseFromPath(value: EndpointParam[], varFromTrimSegment: boolean = false, varFromPath: boolean = false, pathPrefixToRemove: string = '') {
                return value
                        .map((e) =>
                                e.go.typeType === 'string'
                                        ? `${e.go.varName} := r.URL.Query().Get("${e.sql.name}");`
                                        : varFromTrimSegment
                                        ? // todo not hardcode edit, but thats all that uses it for now
                                          `${e.go.varName}Str := strings.TrimSuffix(segment, "/edit")
    ${e.go.varName}, err := ${e.go.parser(`${e.go.varName}Str`)}
        if err != nil {
        http.Error(w, "Invalid ${e.sql.name}", http.StatusBadRequest)
        return
    }`
                                        : varFromPath
                                        ? `${e.go.varName}Str := strings.TrimPrefix(path, "${pathPrefixToRemove}")
    ${e.go.varName}, err := ${e.go.parser(`${e.go.varName}Str`)}
        if err != nil {
        http.Error(w, "Invalid ${e.sql.name}", http.StatusBadRequest)
        return
    }`
                                        : `${e.go.varName}Str := r.URL.Query().Get("${e.sql.name}")
    ${e.go.varName}, err := ${e.go.parser(`${e.go.varName}Str`)}
        if err != nil {
        http.Error(w, "Invalid ${e.sql.name}", http.StatusBadRequest)
        return
    }`
                        )
                        .join('\n\n    ');
        }
}
