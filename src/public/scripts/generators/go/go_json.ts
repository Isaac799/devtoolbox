import { SnakeToCamel } from '../../core/formatting';
import { CodeGenerator, Endpoint } from '../../core/structure';
import { GoRouter } from './go_router';

export class GoJSON extends CodeGenerator {
        Run() {
                let schemas = this.input;

                let goEndpoints: {
                        name: string;
                        method: 'get' | 'put' | 'post' | 'delete';
                        path: string;
                }[] = [];
                let importsParts: string[] = [];

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
                                if (table.hasCompositePrimaryKey()) continue;

                                let allParts: string[] = [];

                                if (table.endpoints.create !== null) {
                                        for (let m = 0; m < table.endpoints.create.length; m++) {
                                                const endpoint = table.endpoints.create[m];
                                                importsParts = importsParts.concat(GoRouter.GenerateImports(endpoint.http.bodyIn, true));

                                                goEndpoints.push({
                                                        name: endpoint.go.fnName,
                                                        method: 'post',
                                                        path: endpoint.path,
                                                });

                                                let str = GoJSON.GenerateCreateSnippet(endpoint);
                                                allParts.push(str);
                                        }
                                }
                                if (table.endpoints.read !== null) {
                                        for (let m = 0; m < table.endpoints.read.length; m++) {
                                                const endpoint = table.endpoints.read[m];
                                                importsParts = importsParts.concat(GoRouter.GenerateImports(endpoint.http.bodyIn, true));

                                                goEndpoints.push({
                                                        name: endpoint.go.fnName,
                                                        method: 'get',
                                                        path: endpoint.path,
                                                });

                                                let str = GoJSON.GenerateReadSnippet(endpoint);
                                                allParts.push(str);
                                        }
                                }
                                if (table.endpoints.update !== null) {
                                        for (let m = 0; m < table.endpoints.update.length; m++) {
                                                const endpoint = table.endpoints.update[m];
                                                importsParts = importsParts.concat(GoRouter.GenerateImports(endpoint.http.bodyIn, false));

                                                goEndpoints.push({
                                                        name: endpoint.go.fnName,
                                                        method: 'put',
                                                        path: endpoint.path,
                                                });

                                                let str = GoJSON.GenerateUpdateSnippet(endpoint);
                                                allParts.push(str);
                                        }
                                }
                                if (table.endpoints.delete !== null) {
                                        for (let m = 0; m < table.endpoints.delete.length; m++) {
                                                const endpoint = table.endpoints.delete[m];
                                                importsParts = importsParts.concat(GoRouter.GenerateImports(endpoint.http.bodyIn, true));

                                                goEndpoints.push({
                                                        name: endpoint.go.fnName,
                                                        method: 'delete',
                                                        path: endpoint.path,
                                                });

                                                let str = GoJSON.CreateDeleteSnippet(endpoint);
                                                allParts.push(str);
                                        }
                                }

                                importsParts = [...new Set(importsParts)];
                                let imports = importsParts
                                        .filter((e) => !!e)
                                        .map((e) => `"${e}"`)
                                        .join('\n');

                                let pkg = `package ${table.goPackageName}
                
                                import (
                                    "encoding/json"
                                    "myapp/pkg/models"
                                    "myapp/pkg/repositories"
                                    "net/http"
                                    "strings"
                                    ${imports}
                                
                                    "github.com/gorilla/mux"
                                )`;

                                allParts.unshift(pkg);

                                let tableStr = allParts.join('\n\n');
                                this.output['/internal/handlers/' + table.label + '/json.go'] = tableStr;
                        }
                }

                const paths: {
                        [path: string]: {
                                [method: string]: string;
                        };
                } = {};

                for (let i = 0; i < goEndpoints.length; i++) {
                        const endpoint = goEndpoints[i];
                        if (!paths[endpoint.path]) {
                                paths[endpoint.path] = {};
                        }
                        paths[endpoint.path][endpoint.method] = endpoint.name;
                }

                // const GETS = endpoints.filter((e)=>e.method==='get')
                // const POSTS = endpoints.filter((e)=>e.method==='post')
                // const PUTS = endpoints.filter((e)=>e.method==='put')
                // const DELS = endpoints.filter((e)=>e.method==='delete')

                let endpointStrs: string[] = [];

                for (const pathName in paths) {
                        if (!Object.prototype.hasOwnProperty.call(paths, pathName)) {
                                continue;
                        }
                        const endpoint = paths[pathName];

                        let things = [
                                endpoint['get']
                                        ? `    case http.MethodGet:
                ${endpoint['get']}(w, r)`
                                        : '',

                                endpoint['post']
                                        ? `    case http.MethodPost:
                ${endpoint['post']}(w, r)`
                                        : '',

                                endpoint['put']
                                        ? `    case http.MethodPut:
                ${endpoint['put']}(w, r)`
                                        : '',

                                endpoint['delete']
                                        ? `    case http.MethodDelete:
                ${endpoint['delete']}(w, r)`
                                        : '',
                        ];
                        things = things.filter((e) => !!e);

                        const endpointsStr = `
    http.HandleFunc("${pathName}", func(w http.ResponseWriter, r *http.Request) {
        switch r.Method {
        ${things.join('\n        ')}
            default:
                http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        }
    })`;
                        endpointStrs.push(endpointsStr);
                }

                return this;
        }

        private static GenerateCreateSnippet(endpoint: Endpoint) {
                let str = `func ${endpoint.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var ${endpoint.go.input.varName} models.${endpoint.go.input.typeType}
        if err := json.NewDecoder(r.Body).Decode(&${endpoint.go.input.varName}); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }

        ${endpoint.primaryKeyEndpointParam.go.varName}, err := repo.${endpoint.routerRepoName}(&${endpoint.go.input.varName}); 
        
        if err != nil {
            http.Error(w, "Error processing: "+err.Error(), http.StatusInternalServerError)
            return
        }

        redirectPath := strings.Join([]string{"${endpoint.path}", ${endpoint.primaryKeyEndpointParam.go.toString(
                        endpoint.primaryKeyEndpointParam.go.varName
                )}}, "/")
        http.Redirect(w, r, redirectPath, http.StatusSeeOther)
    }
}`;
                return str;
        }

        private static GenerateUpdateSnippet(endpoint: Endpoint) {
                let str = `func ${endpoint.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var ${endpoint.go.input.varName} models.${endpoint.go.input.typeType}
        if err := json.NewDecoder(r.Body).Decode(&${endpoint.go.input.varName}); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }

        if err := repo.${endpoint.routerRepoName}(&${endpoint.go.input.varName}); err != nil {
            http.Error(w, "Error processing: "+err.Error(), http.StatusInternalServerError)
            return
        }

        w.WriteHeader(http.StatusCreated)
    }
}`;
                return str;
        }
        private static CreateDeleteSnippet(endpoint: Endpoint) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '    ' + variablesFromPath;

                let str = `func ${endpoint.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
${variablesFromPath}    

        if err := repo.${endpoint.routerRepoName}(${SnakeToCamel(endpoint.primaryKeyName)}); err != nil {
            http.Error(w, "Error deleting: "+err.Error(), http.StatusInternalServerError)
            return
        }

        w.WriteHeader(http.StatusCreated)
    }
}`;

                //         private static GenerateCreateSnippet(endpoint: Endpoint) {
                //                 let str = `func ${endpoint.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
                //     return func(w http.ResponseWriter, r *http.Request) {
                //         var ${endpoint.go.input.varName} ${endpoint.go.input.typeType}
                //         if err := json.NewDecoder(r.Body).Decode(&${endpoint.go.input.varName}); err != nil {
                //             http.Error(w, err.Error(), http.StatusBadRequest)
                //             return
                //         }

                //         if err := repo.${endpoint.routerRepoName}(&${endpoint.go.input.varName}); err != nil {
                //             http.Error(w, "Error inserting: "+err.Error(), http.StatusInternalServerError)
                //             return
                //         }

                //         w.WriteHeader(http.StatusCreated)
                //     }
                // }`;
                return str.trim();
        }

        private static GenerateReadSnippet(endpoint: Endpoint) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '    ' + variablesFromPath;

                if (endpoint.many) {
                        let str = `func ${endpoint.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    ${variablesFromPath}
    return func(w http.ResponseWriter, r *http.Request) {
        ${endpoint.go.input.varName}s, err := repo.${endpoint.routerRepoName}(); 
        
        if err != nil {
            http.Error(w, "Error reading many: "+err.Error(), http.StatusInternalServerError)
            return
        }

        json.NewEncoder(w).Encode(${endpoint.go.input.varName}s)
    }
}`;
                        return str.trim();
                }

                let str = `func ${endpoint.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
${variablesFromPath}
        ${endpoint.go.input.varName}, err := repo.${endpoint.routerRepoName}(${SnakeToCamel(endpoint.primaryKeyName)}); 
        if err != nil {
            http.Error(w, "Error reading: "+err.Error(), http.StatusInternalServerError)
            return
        }

        json.NewEncoder(w).Encode(${endpoint.go.input.varName})
    }
}`;
                return str.trim();
        }

        //         private static GenerateUpdateSnippet(endpoint: Endpoint) {
        //                 let str = `func ${endpoint.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
        //     return func(w http.ResponseWriter, r *http.Request) {
        //         var ${endpoint.go.input.varName} ${endpoint.go.input.typeType}
        //         if err := json.NewDecoder(r.Body).Decode(&${endpoint.go.input.varName}); err != nil {
        //             http.Error(w, err.Error(), http.StatusBadRequest)
        //             return
        //         }

        //         if err := repo.${endpoint.routerRepoName}(&${endpoint.go.input.varName}); err != nil {
        //             http.Error(w, "Error updating: "+err.Error(), http.StatusInternalServerError)
        //             return
        //         }

        //         w.WriteHeader(http.StatusNoContent)
        //     }
        // }`;
        //                 return str.trim();
        //         }

        //         private static GenerateDeleteSnippet(endpoint: Endpoint) {
        //                 let str = `func ${endpoint.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
        //     return func(w http.ResponseWriter, r *http.Request) {
        //         var ${endpoint.go.input.varName} ${endpoint.go.input.typeType}
        //         if err := json.NewDecoder(r.Body).Decode(&${endpoint.go.input.varName}); err != nil {
        //             http.Error(w, err.Error(), http.StatusBadRequest)
        //             return
        //         }

        //         if err := repo.${endpoint.routerRepoName}(&${endpoint.go.input.varName}); err != nil {
        //             http.Error(w, "Error deleting: "+err.Error(), http.StatusInternalServerError)
        //             return
        //         }

        //         w.WriteHeader(http.StatusNoContent)
        //     }
        // }`;
        //                 return str.trim();
        //         }
}
