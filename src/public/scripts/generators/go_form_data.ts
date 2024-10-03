import { alignKeyword, alignKeywords, SnakeToCamel } from '../core/formatting';
import { CodeGenerator, Endpoint, EndpointParam, HttpMethod, SQL_TO_GO_TYPE, SqlTable } from '../core/structure';
import { GoRouter } from './go_router';

export class GoFormData extends CodeGenerator {
        Run() {
                let schemas = this.input;
                let importsParts: string[] = [];

                let goEndpoints: {
                        name: string;
                        method: 'get' | 'put' | 'post' | 'delete';
                        path: string;
                }[] = [];

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

                                                let str = GoFormData.GenerateCreateSnippet(table, endpoint);
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

                                                let str = GoFormData.GenerateUpdateSnippet(table, endpoint);
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

                                                let str = GoFormData.CreateDeleteSnippet(endpoint);
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
    "myapp/pkg/models"
    "myapp/pkg/repositories"
    "net/http"
    "strings"
    ${imports}

    "github.com/gorilla/mux"
)`;

                                allParts.unshift(pkg);
                                let tableStr = allParts.join('\n\n');
                                this.output['/internal/handlers/' + table.label + '/form.go'] = tableStr;
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

        private static GenerateCreateSnippet(table: SqlTable, endpoint: Endpoint) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '\n    ' + variablesFromPath;

                let str = `func ${endpoint.routerFuncFormName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {${variablesFromPath}    
        if err := r.ParseForm(); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }      

        ${GoFormData.ParseFromForm(endpoint.http.bodyIn, true)}

        ${GoFormData.BuildVarFromTheForm(table, endpoint, true)}

        ${endpoint.primaryKeyEndpointParam.go.varName}, err := repo.${endpoint.routerRepoName}(&${endpoint.go.input.varName}); 
        
        if err != nil {
            http.Error(w, "Error processing: "+err.Error(), http.StatusInternalServerError)
            return
        }

        redirectPath := strings.Join([]string{"${endpoint.redirectPath}", ${endpoint.primaryKeyEndpointParam.go.toString(
                        endpoint.primaryKeyEndpointParam.go.varName
                )}}, "/")
        http.Redirect(w, r, redirectPath, http.StatusSeeOther)
    }
}`;
                return str;
        }

        private static GenerateUpdateSnippet(table: SqlTable, endpoint: Endpoint) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '\n    ' + variablesFromPath;

                let str = `func ${endpoint.routerFuncFormName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {${variablesFromPath}    
        if err := r.ParseForm(); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }      

        ${GoFormData.ParseFromForm(endpoint.http.bodyIn, false)}

        ${GoFormData.BuildVarFromTheForm(table, endpoint, false)}

        if err := repo.${endpoint.routerRepoName}(&${endpoint.go.input.varName}); err != nil {
            http.Error(w, "Error processing: "+err.Error(), http.StatusInternalServerError)
            return
        }

        redirectPath := strings.Join([]string{"${endpoint.redirectPath}", ${endpoint.primaryKeyEndpointParam.go.varName}Str}, "/")
        http.Redirect(w, r, redirectPath, http.StatusSeeOther)
    }
}`;
                return str;
        }

        private static CreateDeleteSnippet(endpoint: Endpoint) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '    ' + variablesFromPath;

                let str = `func ${endpoint.routerFuncFormName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
${variablesFromPath}    

        if err := repo.${endpoint.routerRepoName}(${SnakeToCamel(endpoint.primaryKeyName)}); err != nil {
            http.Error(w, "Error deleting: "+err.Error(), http.StatusInternalServerError)
            return
        }

        http.Redirect(w, r, "${endpoint.redirectPath}", http.StatusSeeOther)
    }
}`;

                return str.trim();
        }

        private static BuildVarFromTheForm(table: SqlTable, endpoint: Endpoint, forCreate: boolean) {
                function FormatStack(stack: string[]) {
                        let types = alignKeywords(
                                stack,
                                Object.values(SQL_TO_GO_TYPE).map((e) => e.goType)
                        );
                        let jsons = alignKeyword(types, '`json:');
                        return jsons;
                }

                let outputStack: string[] = [];
                let stack: string[] = [];

                let pk = endpoint.primaryKeyName;

                stack.push(`${endpoint.go.input.varName} := models.${endpoint.go.input.typeType} {`);

                // let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                // variablesFromPath = '\n    ' + variablesFromPath;

                for (const attr of table.endpoints.existsAs) {
                        if (!forCreate && attr.readOnly) continue;
                        if (attr.sql.name === pk) {
                                if (endpoint.method !== HttpMethod.POST) {
                                        stack.push(`    ${attr.go.typeName}: ${attr.go.varName},`);
                                }
                        } else {
                                // stack.push(`    ${attr.go.typeName}: r.FormValue("${attr.sql.name}"),`);
                                stack.push(`    ${attr.go.typeName}: ${attr.go.varName},`);
                        }
                }

                stack.push('}');
                outputStack.push(FormatStack(stack).join(`\n        `));
                stack = [];

                let fileContent = outputStack.join('\n        ').trim();

                return fileContent;
        }

        private static ParseFromForm(value: EndpointParam[], forCreate: boolean) {
                let items = [...value];
                if (!forCreate) {
                        items = items.filter((e) => !e.readOnly);
                }
                return items
                        .map(
                                (e) =>
                                        e.go.typeType === 'string'
                                                ? `${e.go.varName} := r.FormValue("${e.sql.name}")`
                                                : `    ${e.go.varName}Str := r.FormValue("${e.sql.name}") 
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
