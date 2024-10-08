import { SnakeToCamel, SnakeToTitle } from '../../core/formatting';
import { CodeGenerator, Endpoint, HttpMethodToHtmlName, SqlTable } from '../../core/structure';
import { GoRouter } from './go_router';

export class GoHTML extends CodeGenerator {
        Run() {
                // this.output = {
                //         'app_handler.go': this.GenerateRenderer(),
                // };
                this.GenerateRenderer();
                return this;
        }

        GenerateRenderer() {
                let schemas = this.input;
                let importsParts: string[] = [];

                for (const schemaName in schemas) {
                        if (!Object.prototype.hasOwnProperty.call(schemas, schemaName)) {
                                continue;
                        }
                        const schema = schemas[schemaName];

                        for (const tableName in schema.tables) {
                                let allParts: string[] = [];

                                if (!Object.prototype.hasOwnProperty.call(schema.tables, tableName)) {
                                        continue;
                                }
                                const table = schema.tables[tableName];
                                if (table.hasCompositePrimaryKey()) continue;
                                if (!table.endpoints) continue;

                                if (!table.singlePk) {
                                        continue;
                                }
                                importsParts = importsParts.concat(GoRouter.GenerateImports(table.is, true, false));

                                {
                                        let endpoint = table.endpoints.create.single;
                                        let title = SnakeToTitle(`${HttpMethodToHtmlName(endpoint.method, false)}_${table.label}`);
                                        let filePath = endpoint.url.filePath + '/new.html';
                                        allParts.push(GoHTML.GenerateNewSnippet(endpoint, title, filePath));
                                }

                                {
                                        let endpoint = table.endpoints.read.single;
                                        let title = SnakeToTitle(`${HttpMethodToHtmlName(endpoint.method, false)}_${table.label}`);

                                        let filePath = endpoint.url.filePath + '/show.html';
                                        allParts.push(GoHTML.GenerateShowSnippet(endpoint, title, filePath, table));
                                }
                                {
                                        let endpoint = table.endpoints.read.many;
                                        let title = SnakeToTitle(`${HttpMethodToHtmlName(endpoint.method, true)}_${table.label}`);

                                        let filePath = endpoint.url.filePath + '/index.html';
                                        allParts.push(GoHTML.GenerateIndexSnippet(endpoint, title, filePath));
                                }
                                {
                                        let endpoint = table.endpoints.update.single;
                                        let title = SnakeToTitle(`${HttpMethodToHtmlName(endpoint.method, false)}_${table.label}`);
                                        let filePath = endpoint.url.filePath + '/edit.html';
                                        allParts.push(GoHTML.GenerateEditSnippet(endpoint, title, filePath, table));
                                }

                                let renderFunctions = allParts.join('\n\n');

                                importsParts = [...new Set(importsParts)];

                                let imports = importsParts
                                        .filter((e) => !!e)
                                        .map((e) => `"${e}"`)
                                        .join('\n');

                                let str = `package ${table.goPackageName}

import (
    "log"
    "myapp/pkg/models"
    "myapp/pkg/repositories"
    "myapp/pkg/validation"
    "myapp/pkg/services"
    "net/http"
    
    ${imports}
)
   
${renderFunctions}
`;

                                this.output['/internal/handlers/' + table.label + '/html.go'] = str;
                        }
                }
        }

        private static GenerateEditSnippet(endpoint: Endpoint, title: string, filePath: string, table: SqlTable) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n        ');
                let funcParams = `repo *repositories.${endpoint.repo.type}, changeset *validation.Changeset[models.${endpoint.go.real.type}]`;

                let str = `func ${endpoint.go.routerFuncName}(${funcParams}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
    
        if changeset == nil {
            ${variablesFromPath}
            ${endpoint.go.real.name}, err := repo.${table.endpoints!.read.single.go.routerRepoName}(${SnakeToCamel(table.singlePk!.value)}); 
            if err != nil {
                log.Print(err.Error())
                http.Redirect(w, r, "/500", http.StatusTemporaryRedirect)
                return
            }
            newChangeset := ${endpoint.go.real.name}.${endpoint.changeSetName}()
            changeset = &newChangeset
        }
        services.RenderPageWithChangeset(w, r, "${title}", "${filePath}", changeset)
    }
}`;
                return str.trim();
        }
        private static GenerateNewSnippet(endpoint: Endpoint, title: string, filePath: string) {
                let str = `func ${endpoint.go.routerFuncName}(changeset *validation.Changeset[models.${endpoint.go.real.type}]) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        services.RenderPageWithChangeset(w, r, "${title}", "${filePath}", changeset)
    }
}`;
                return str.trim();
        }
        private static GenerateIndexSnippet(endpoint: Endpoint, title: string, filePath: string) {
                let str = `func ${endpoint.go.routerFuncName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        offset, limit, page := services.GetPagination(r, 10, 1) // Default limit 10 and page 1
        ${endpoint.go.real.name}s, err := repo.${endpoint.go.routerRepoName}(offset, limit);

        if err != nil {
                log.Print(err.Error())
                http.Redirect(w, r, "/500", http.StatusTemporaryRedirect)
                return
        }

        // Get total count for pagination
        totalCount, err := repo.GetTotalCount()

        if err != nil {
                log.Print(err.Error())
                http.Redirect(w, r, "/500", http.StatusTemporaryRedirect)
                return
        }        

        totalPages := (totalCount + limit - 1) / limit
        previousPage := page - 1
        nextPage := page + 1

        pageData := models.Pagination[models.${endpoint.go.real.type}]{
            Items:        &${endpoint.go.real.name}s,
            CurrentPage:  page,
            TotalPages:   totalPages,
            TotalCount:   totalCount,
            Limit:        limit,
            PreviousPage: previousPage,
            NextPage:     nextPage,
            ShowFirst:    page > 2,
            ShowPrevious: previousPage > 0,
            ShowNext:     nextPage <= totalPages,
            ShowLast:     totalPages > 1 && page < totalPages-1,
        }
            
        
        
        services.RenderPageWithData(w, r, "${title}", "${filePath}", &pageData)
    }
}`;
                return str.trim();
        }

        private static GenerateShowSnippet(endpoint: Endpoint, title: string, filePath: string, table: SqlTable) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '    ' + variablesFromPath;

                if (table.isReferencedBy) {
                }

                if (table.hasReferenceTo) {
                }

                let str = `func ${endpoint.go.routerFuncName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
${variablesFromPath}
        ${endpoint.go.real.name}, err := repo.${table.endpoints!.read.single.go.routerRepoName}(${SnakeToCamel(table.singlePk!.value)}); 
        if err != nil {
            log.Print(err.Error())
            http.Redirect(w, r, "/500", http.StatusTemporaryRedirect)
            return
        }
        services.RenderPageWithData(w, r, "${title}", "${filePath}", &${endpoint.go.real.name})
    }
}`;
                return str.trim();
        }
}
