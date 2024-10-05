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
                                if (!table.endpoints) continue;

                                if (!table.singlePk) {
                                        continue;
                                }
                                importsParts = importsParts.concat(GoRouter.GenerateImports(table.is, true));

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
                                        allParts.push(GoHTML.GenerateShowEditSnippet(endpoint, title, filePath, table));
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
                                        allParts.push(GoHTML.GenerateShowEditSnippet(endpoint, title, filePath, table));
                                }

                                let renderFunctions = allParts.join('\n\n');

                                // time is for the date on page
                                importsParts.push('time');
                                importsParts = [...new Set(importsParts)];
                                console.log('importsParts :>> ', importsParts);

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

        private static GenerateShowEditSnippet(endpoint: Endpoint, title: string, filePath: string, table: SqlTable) {
                let variablesFromPath = GoRouter.ParseFromPath(endpoint.http.path).split('\n').join('\n    ');
                variablesFromPath = '    ' + variablesFromPath;

                let str = `func ${endpoint.go.routerFuncName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
${variablesFromPath}
        ${endpoint.go.real.name}, err := repo.${table.endpoints!.read.single.go.routerRepoName}(${SnakeToCamel(table.singlePk!.value)}); 
        if err != nil {
            http.Error(w, "Error reading many: "+err.Error(), http.StatusInternalServerError)
            return
        }
        renderPage(w, r, "${title}", "${filePath}", ${endpoint.go.real.name})
    }
}`;
                return str.trim();
        }
        private static GenerateNewSnippet(endpoint: Endpoint, title: string, filePath: string) {
                let str = `func ${endpoint.go.routerFuncName}(w http.ResponseWriter, r *http.Request) {
    renderPage(w, r, "${title}", "${filePath}", nil)
}`;
                return str.trim();
        }
        private static GenerateIndexSnippet(endpoint: Endpoint, title: string, filePath: string) {
                let str = `func ${endpoint.go.routerFuncName}(repo *repositories.${endpoint.repo.type}) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        ${endpoint.go.real.name}s, err := repo.${endpoint.go.routerRepoName}(); 
        if err != nil {
            http.Error(w, "Error reading many: "+err.Error(), http.StatusInternalServerError)
            return
        }
        renderPage(w, r, "${title}", "${filePath}", ${endpoint.go.real.name}s)
    }
}`;
                return str.trim();
        }
}
