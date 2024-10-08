import { alignKeyword, alignKeywords } from '../../core/formatting';
import { CodeGenerator, Endpoint, EndpointParam, HttpMethod, SQL_TO_GO_TYPE, SqlTable } from '../../core/structure';
import { GoRouter } from './go_router';

export class GoFormData extends CodeGenerator {
        Run() {
                let schemas = this.input;
                let importsParts: string[] = [];

                let goEndpoints: {
                        name: string;
                        method: 'get' | 'put' | 'post' | 'delete';
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
                                if (!table.endpoints) continue;

                                let allParts: string[] = [];
                                // importsParts = importsParts.concat(GoRouter.GenerateImports(table.is, true));

                                {
                                        const endpoint = table.endpoints.create.single;
                                        importsParts = importsParts.concat(GoRouter.GenerateImports(endpoint.http.bodyIn, true, false));

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'post',
                                        });

                                        let str = GoFormData.GenerateCreateSnippet(table, endpoint);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.update.single;
                                        importsParts = importsParts.concat(GoRouter.GenerateImports(endpoint.http.bodyIn, true, true));

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'put',
                                        });

                                        let str = GoFormData.GenerateUpdateSnippet(table, endpoint);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.delete.single;
                                        importsParts = importsParts.concat(GoRouter.GenerateImports(endpoint.http.bodyIn, true, false));

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'delete',
                                        });

                                        let str = GoFormData.CreateDeleteSnippet(table, endpoint);
                                        allParts.push(str);
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
)`;

                                allParts.unshift(pkg);
                                let tableStr = allParts.join('\n\n');
                                this.output['/internal/handlers/' + table.label + '/form.go'] = tableStr;
                        }
                }

                return this;
        }

        private static GenerateCreateSnippet(table: SqlTable, endpoint: Endpoint) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '\n    ' + variablesFromPath;
                let idFromChangeset = `changeset.Record.${endpoint.go.primaryKey.go.var.propertyName}`;
                let redirectId = endpoint.go.primaryKey.go.stuff.toStringFunction(idFromChangeset);

                let str = `func ${endpoint.go.routerFuncFormName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {${variablesFromPath}    
        if err := r.ParseForm(); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }      

        ${GoFormData.ParseFromForm(endpoint.http.bodyIn)}

        ${GoFormData.BuildVarFromTheForm(table, endpoint, true)}

        changeset := repo.${endpoint.go.routerRepoName}(&${endpoint.go.real.name}); 
        
        if !changeset.IsValid() {
            ${table.endpoints!.create.single.go.routerFuncName}(changeset)(w, r)
            return
        }

        redirectPath := strings.Join([]string{"${endpoint.url.indexPage}", ${redirectId}}, "/")
        http.Redirect(w, r, redirectPath, http.StatusSeeOther)
    }
}`;
                return str;
        }

        private static GenerateUpdateSnippet(table: SqlTable, endpoint: Endpoint) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '\n    ' + variablesFromPath;
                let setVarsFromGottenRecord = endpoint.http.bodyIn
                        .map((e) => `${endpoint.go.real.name}.${e.go.var.propertyName} = ${e.go.var.propertyAsVariable}`)
                        .join('\n    ');

                let str = `func ${endpoint.go.routerFuncFormName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {${variablesFromPath}    
        if err := r.ParseForm(); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }      

        ${GoFormData.ParseFromForm(endpoint.http.bodyIn)}

        ${endpoint.go.real.name}, err := repo.${table.endpoints!.read.single.go.routerRepoName}(${endpoint.go.primaryKey.go.var.propertyAsVariable})
        if err != nil {
            http.Error(w, "record not found", http.StatusBadRequest)
            return
        }

        ${setVarsFromGottenRecord}

        changeset := repo.${endpoint.go.routerRepoName}(&${endpoint.go.real.name}); 
        
        if !changeset.IsValid() {
            ${table.endpoints!.update.single.go.routerFuncName}(repo, changeset)(w, r)
            return
        }

        redirectPath := strings.Join([]string{"${endpoint.url.indexPage}", ${endpoint.go.primaryKey.go.var.propertyAsVariable}Str}, "/")
        http.Redirect(w, r, redirectPath, http.StatusSeeOther)
    }
}`;
                return str;
        }

        private static CreateDeleteSnippet(table: SqlTable, endpoint: Endpoint) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '    ' + variablesFromPath;

                let str = `func ${endpoint.go.routerFuncFormName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
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

        http.Redirect(w, r, "${endpoint.url.indexPage}", http.StatusSeeOther)
    }
}`;

                return str.trim();
        }

        private static BuildVarFromTheForm(table: SqlTable, endpoint: Endpoint, forCreate: boolean) {
                if (!table.singlePk) {
                        return '';
                }
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

                stack.push(`${endpoint.go.real.name} := models.${endpoint.go.real.type} {`);

                // let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                // variablesFromPath = '\n    ' + variablesFromPath;

                for (const attr of endpoint.http.bodyIn) {
                        if (attr.sql.name === table.singlePk.value) {
                                if (!forCreate && endpoint.method !== HttpMethod.POST) {
                                        stack.push(`    ${attr.go.var.propertyName}: ${attr.go.var.propertyAsVariable},`);
                                }
                                continue;
                        }

                        if (!forCreate && (attr.readOnly || attr.systemField)) continue;

                        // stack.push(`    ${attr.go.typeName}: r.FormValue("${attr.sql.name}"),`);
                        stack.push(`    ${attr.go.var.propertyName}: ${attr.go.var.propertyAsVariable},`);
                }

                stack.push('}');
                outputStack.push(FormatStack(stack).join(`\n        `));
                stack = [];

                let fileContent = outputStack.join('\n        ').trim();

                return fileContent;
        }

        private static ParseFromForm(value: EndpointParam[]) {
                return value
                        .map(
                                (e) =>
                                        e.go.var.propertyGoType === 'string'
                                                ? `${e.go.var.propertyAsVariable} := r.FormValue("${e.sql.name}")`
                                                : `    ${e.go.var.propertyAsVariable}Str := r.FormValue("${e.sql.name}") 
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
}
