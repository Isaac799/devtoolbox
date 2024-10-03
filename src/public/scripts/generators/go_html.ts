import { SnakeToCamel, SnakeToTitle } from '../core/formatting';
import { CodeGenerator, Endpoint, EndpointGoShow, HttpMethodToHtmlName } from '../core/structure';
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
                let allParts: string[] = [];

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

                                if (!table.endpoints.goShow) {
                                        console.error('missing table.endpoints.goShow on generate render');
                                        continue;
                                }

                                if (table.endpoints.create) {
                                        for (const endpoint of table.endpoints.create) {
                                                importsParts = importsParts.concat(GoRouter.GenerateImports(endpoint.http.bodyIn, true));
                                                let title = SnakeToTitle(`${HttpMethodToHtmlName(endpoint.method, endpoint.many)}_${table.label}`);
                                                let filePath = '/web/templates' + endpoint.url + '/new.html';
                                                allParts.push(GoHTML.GenerateNewSnippet(endpoint, title, filePath));
                                        }
                                }

                                if (table.endpoints.read) {
                                        for (const endpoint of table.endpoints.read) {
                                                importsParts = importsParts.concat(GoRouter.GenerateImports(endpoint.http.bodyIn, true));
                                                let title = SnakeToTitle(`${HttpMethodToHtmlName(endpoint.method, endpoint.many)}_${table.label}`);
                                                if (endpoint.many) {
                                                        let filePath = '/web/templates' + endpoint.url + '/index.html';
                                                        allParts.push(GoHTML.GenerateIndexSnippet(endpoint, title, filePath));
                                                } else {
                                                        let filePath = '/web/templates' + endpoint.url + '/show.html';
                                                        allParts.push(GoHTML.GenerateShowEditSnippet(endpoint, title, filePath, table.endpoints.goShow));
                                                }
                                        }
                                }

                                if (table.endpoints.update) {
                                        for (const endpoint of table.endpoints.update) {
                                                importsParts = importsParts.concat(GoRouter.GenerateImports(endpoint.http.bodyIn, false));
                                                let title = SnakeToTitle(`${HttpMethodToHtmlName(endpoint.method, endpoint.many)}_${table.label}`);
                                                let filePath = '/web/templates' + endpoint.url + '/edit.html';
                                                allParts.push(GoHTML.GenerateShowEditSnippet(endpoint, title, filePath, table.endpoints.goShow));
                                        }
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
    "myapp/pkg/repositories"
    "net/http"
    "text/template"
    "time"
    ${imports}

    "github.com/gorilla/mux"
)

func renderPage(w http.ResponseWriter, _ *http.Request, title, templateName string, data interface{}) {
    templateData := struct {
       Title string
       Year  int
       Data  interface{}
    }{
       Title: title,
       Year:  time.Now().Year(),
       Data:  data,
    }

    pageTemplate, err := template.ParseFiles(
       "../../web/templates/base.html",
       "../../" + templateName,
       "../../web/templates/navbar.html",
       "../../web/templates/footer.html",
    )

    if err != nil {
       log.Println("Error parsing templates:", err)
       http.Error(w, "Internal server error", http.StatusInternalServerError)
       return
    }

    err = pageTemplate.ExecuteTemplate(w, "base.html", templateData)
    if err != nil {
       log.Println("Error executing template:", err)
       http.Error(w, "Internal server error", http.StatusInternalServerError)
    }
}

func ShowHome(w http.ResponseWriter, r *http.Request) {
    renderPage(w, r, "Home", "show.home.html", nil)
}

${renderFunctions}
`;

                                this.output['/internal/handlers/' + table.label + '/html.go'] = str;
                        }
                }
        }

        private static GenerateShowEditSnippet(endpoint: Endpoint, title: string, filePath: string, getEndpoint: EndpointGoShow) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '    ' + variablesFromPath;

                let str = `func ${endpoint.routerFuncName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
${variablesFromPath}
        ${endpoint.go.input.varName}, err := repo.${getEndpoint.routerRepoName}(${SnakeToCamel(endpoint.primaryKeyName)}); 
        if err != nil {
            http.Error(w, "Error reading many: "+err.Error(), http.StatusInternalServerError)
            return
        }
        renderPage(w, r, "${title}", "${filePath}", ${endpoint.go.input.varName})
    }
}`;
                return str.trim();
        }
        private static GenerateNewSnippet(endpoint: Endpoint, title: string, filePath: string) {
                let str = `func ${endpoint.routerFuncName}(w http.ResponseWriter, r *http.Request) {
    renderPage(w, r, "${title}", "${filePath}", nil)
}`;
                return str.trim();
        }
        private static GenerateIndexSnippet(endpoint: Endpoint, title: string, filePath: string) {
                let str = `func ${endpoint.routerFuncName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        ${endpoint.go.input.varName}s, err := repo.${endpoint.routerRepoName}(); 
        if err != nil {
            http.Error(w, "Error reading many: "+err.Error(), http.StatusInternalServerError)
            return
        }
        renderPage(w, r, "${title}", "${filePath}", ${endpoint.go.input.varName}s)
    }
}`;
                return str.trim();
        }
}
