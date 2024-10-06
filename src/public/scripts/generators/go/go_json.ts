import { CodeGenerator, Endpoint, SqlTable } from '../../core/structure';
import { GoRouter } from './go_router';

export class GoJSON extends CodeGenerator {
        Run() {
                let schemas = this.input;

                let goEndpoints: {
                        name: string;
                        method: 'get' | 'put' | 'post' | 'delete';
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
                                if (!table.endpoints) continue;

                                let allParts: string[] = [];

                                {
                                        const endpoint = table.endpoints.create.single;

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'post',
                                        });

                                        let str = GoJSON.GenerateCreateSnippet(endpoint);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.read.single;
                                        importsParts = importsParts.concat(GoRouter.GenerateImports([endpoint.http.query], true, true));

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'get',
                                        });

                                        let str = GoJSON.GenerateReadSingleSnippet(endpoint);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.read.many;

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'get',
                                        });

                                        let str = GoJSON.GenerateReadManySnippet(endpoint);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.update.single;

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'put',
                                        });

                                        let str = GoJSON.GenerateUpdateSnippet(endpoint);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.delete.single;
                                        importsParts = importsParts.concat(GoRouter.GenerateImports([endpoint.http.query], true, false));

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'delete',
                                        });

                                        let str = GoJSON.CreateDeleteSnippet(table, endpoint);
                                        allParts.push(str);
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
)`;

                                allParts.unshift(pkg);

                                let tableStr = allParts.join('\n\n');
                                this.output['/internal/handlers/' + table.label + '/json.go'] = tableStr;
                        }
                }

                return this;
        }

        private static GenerateCreateSnippet(endpoint: Endpoint) {
                let idFromChangeset = `changeset.Record.${endpoint.go.primaryKey.go.var.propertyName}`;
                let redirectId = endpoint.go.primaryKey.go.stuff.toStringFunction(idFromChangeset);

                let str = `func ${endpoint.go.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var ${endpoint.go.real.name} models.${endpoint.go.real.type}
        if err := json.NewDecoder(r.Body).Decode(&${endpoint.go.real.name}); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }

        changeset := repo.${endpoint.go.routerRepoName}(&${endpoint.go.real.name}); 
        
        if !changeset.IsValid() {
            http.Error(w, "Error creating", http.StatusInternalServerError)
            return
        }

        redirectPath := strings.Join([]string{"${endpoint.url.indexPage}", ${redirectId}}, "/")
        http.Redirect(w, r, redirectPath, http.StatusSeeOther)
    }
}`;
                return str;
        }

        private static GenerateUpdateSnippet(endpoint: Endpoint) {
                let str = `func ${endpoint.go.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var ${endpoint.go.real.name} models.${endpoint.go.real.type}
        if err := json.NewDecoder(r.Body).Decode(&${endpoint.go.real.name}); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
            
        changeset := repo.${endpoint.go.routerRepoName}(&${endpoint.go.real.name});
        
        if !changeset.IsValid() {
            http.Error(w, "Error updating", http.StatusInternalServerError)
            return
        }

        w.WriteHeader(http.StatusCreated)
    }
}`;
                return str;
        }
        private static CreateDeleteSnippet(table: SqlTable, endpoint: Endpoint) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '    ' + variablesFromPath;

                let str = `func ${endpoint.go.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
${variablesFromPath}    

        ${endpoint.go.real.name}, err := repo.${table.endpoints!.read.single.go.routerRepoName}(${endpoint.go.primaryKey.go.var.propertyAsVariable})
        if err != nil {
            http.Error(w, "record not found", http.StatusBadRequest)
            return
        }

        changeset := repo.${endpoint.go.routerRepoName}(&${endpoint.go.real.name}); 
        
        if !changeset.IsValid() {
            ${table.endpoints!.update.single.go.routerFuncName}(repo, changeset)(w, r)
            return
        }

        w.WriteHeader(http.StatusCreated)
    }
}`;

                //         private static GenerateCreateSnippet(endpoint: Endpoint) {
                //                 let str = `func ${endpoint.go.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
                //     return func(w http.ResponseWriter, r *http.Request) {
                //         var ${endpoint.go.input.varName} ${endpoint.go.input.typeType}
                //         if err := json.NewDecoder(r.Body).Decode(&${endpoint.go.input.varName}); err != nil {
                //             http.Error(w, err.Error(), http.StatusBadRequest)
                //             return
                //         }

                //         if err := repo.${endpoint.go.routerRepoName}(&${endpoint.go.input.varName}); err != nil {
                //             http.Error(w, "Error inserting: "+err.Error(), http.StatusInternalServerError)
                //             return
                //         }

                //         w.WriteHeader(http.StatusCreated)
                //     }
                // }`;
                return str.trim();
        }

        private static GenerateReadSingleSnippet(endpoint: Endpoint) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '    ' + variablesFromPath;

                let str = `func ${endpoint.go.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
${variablesFromPath}
        ${endpoint.go.real.name}, err := repo.${endpoint.go.routerRepoName}(${endpoint.go.primaryKey.go.var.propertyAsVariable}); 
        if err != nil {
            http.Error(w, "Error reading: "+err.Error(), http.StatusInternalServerError)
            return
        }

        json.NewEncoder(w).Encode(${endpoint.go.real.name})
    }
}`;
                return str.trim();
        }

        private static GenerateReadManySnippet(endpoint: Endpoint) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '    ' + variablesFromPath;

                let str = `func ${endpoint.go.routerFuncApiName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    ${variablesFromPath}
    return func(w http.ResponseWriter, r *http.Request) {
        ${endpoint.go.real.name}s, err := repo.${endpoint.go.routerRepoName}(); 
        
        if err != nil {
            http.Error(w, "Error reading many: "+err.Error(), http.StatusInternalServerError)
            return
        }

        json.NewEncoder(w).Encode(${endpoint.go.real.name}s)
    }
}`;
                return str.trim();
        }
}
