import { SnakeToPascal, SnakeToTitle } from '../core/formatting';
import { CodeGenerator, Endpoint, HttpMethodToHtmlName, SqlTable } from '../core/structure';
import { GoSsrRouter } from './go_ssr_router';
import { SqlGenerator } from './postgres_sql';

export class GoSsrRender extends CodeGenerator {
        Run() {
                this.output = {
                        'render.go': this.GenerateRenderer(),
                };
                return this;
        }

        GenerateRenderer(): string {
                let renderFunctionItems: {
                        funcName: string;
                        filePath: string;
                        pageTitle: string;
                        pageData: string;
                        queryGoesIntoVarName: string;
                }[] = [];

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
                                                let title = SnakeToTitle(`${HttpMethodToHtmlName(endpoint.method, endpoint.many)}_${table.label}`);
                                                renderFunctionItems.push({
                                                        funcName: endpoint.routerFuncName,
                                                        filePath: 'templates' + endpoint.url + '/new.html',
                                                        pageTitle: title,
                                                        pageData: 'nil',
                                                        queryGoesIntoVarName: `${endpoint.go.output.varName}`, // not needed
                                                });
                                        }
                                }

                                if (table.endpoints.read) {
                                        for (const endpoint of table.endpoints.read) {
                                                let title = SnakeToTitle(`${HttpMethodToHtmlName(endpoint.method, endpoint.many)}_${table.label}`);
                                                if (endpoint.many) {
                                                        renderFunctionItems.push({
                                                                funcName: endpoint.routerFuncName,
                                                                filePath: endpoint.url,
                                                                pageTitle: title,
                                                                pageData: GoSsrRender.GenerateReadSnippet(endpoint, table),
                                                                queryGoesIntoVarName: `${endpoint.go.output.varName}s`,
                                                        });
                                                } else {
                                                        renderFunctionItems.push({
                                                                funcName: endpoint.routerFuncName,
                                                                filePath: endpoint.url,
                                                                pageTitle: title,
                                                                pageData: GoSsrRender.GenerateReadSnippet(endpoint, table),
                                                                queryGoesIntoVarName: `${endpoint.go.output.varName}`,
                                                        });
                                                }
                                        }
                                }

                                if (table.endpoints.update) {
                                        for (const endpoint of table.endpoints.update) {
                                                let title = SnakeToTitle(`${HttpMethodToHtmlName(endpoint.method, endpoint.many)}_${table.label}`);
                                                renderFunctionItems.push({
                                                        funcName: endpoint.routerFuncName,
                                                        filePath: 'templates' + endpoint.url + '/new.html',
                                                        pageTitle: title,
                                                        pageData: GoSsrRender.GenerateReadSnippet(endpoint, table),
                                                        queryGoesIntoVarName: `${endpoint.go.output.varName}`,
                                                });
                                        }
                                }
                        }
                }

                let renderFunctions = renderFunctionItems
                        .map((e) => {
                                return `func ${e.funcName}(w http.ResponseWriter, r *http.Request, segment string) {
    ${
            e.pageData === 'nil'
                    ? `renderPage(w, r, "${e.pageTitle}", "${e.filePath}", nil)`
                    : `${e.pageData}\n    renderPage(w, r, "${e.pageTitle}", "${e.filePath}", ${e.queryGoesIntoVarName})`
    }
}`;
                        })
                        .join('\n\n');

                let str = `package main

import (
    "log"
    "net/http"
    "path/filepath"
    "text/template"
    "time"
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
       "templates/base.html",
       "templates/"+templateName,
       "templates/navbar.html",
       "templates/footer.html",
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

                // Note that these *Segment function can be more generic, but is done this
                // way for easier parsing into the correct type

                return str;
        }

        private static GenerateReadSnippet(endpoint: Endpoint, table: SqlTable) {
                let scanInto = endpoint.sql.outputs.map((e) => `&${endpoint.go.output.varName}.${SnakeToPascal(e.sql.sqlLocation.column)}`).join(', ');

                let variablesFromPath = GoSsrRouter.ParseFromPath(endpoint.http.path, true);

                let inputsForQuery = endpoint.http.path.map((e) => `${e.go.varName}`);
                let inputsForQuery2 = endpoint.http.bodyIn.map((e) => `${endpoint.go.input.varName}.${e.go.typeName}`);
                let inputs = [...inputsForQuery, ...inputsForQuery2].join(', ');

                // let inputs = endpoint.inputs.map((e) => `${endpoint.go.input.name}.${e.go.name}`);

                if (endpoint.many) {
                        let str = `
    query := \`${SqlGenerator.GenerateAReadEndpoint(endpoint, table, true)}\`
    rows, err := db.Query(query)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var ${endpoint.go.output.varName}s []${endpoint.go.output.typeType}
    for rows.Next() {
        var ${endpoint.go.output.varName} ${endpoint.go.output.typeType}
        err := rows.Scan(${scanInto})
        if err != nil {
           http.Error(w, err.Error(), http.StatusInternalServerError)
           return
        }
        ${endpoint.go.output.varName}s = append(${endpoint.go.output.varName}s, ${endpoint.go.output.varName})
    }

    if err = rows.Err(); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }`;
                        return str.trim();
                }

                if (inputs.length === 0) {
                        let str = `
    query := \`${SqlGenerator.GenerateAReadEndpoint(endpoint, table, true)}\`
    
    var ${endpoint.go.output.varName} ${endpoint.go.output.typeType}
    err := db.QueryRow(query, ${inputs}).Scan(${scanInto})
    
    if err == sql.ErrNoRows {
       http.Error(w, "Record not found for this ${endpoint.go.real.name}", http.StatusNotFound)
       return
    } else if err != nil {
       http.Error(w, "Error fetching ${endpoint.go.real.name}: "+err.Error(), http.StatusInternalServerError)
       return
    }`;
                        return str.trim();
                }

                // var ${endpoint.go.input.name} ${endpoint.go.input.type}

                let str = `
    ${variablesFromPath}

    query := \`${SqlGenerator.GenerateAReadEndpoint(endpoint, table, true)}\`
    
    var ${endpoint.go.output.varName} ${endpoint.go.output.typeType}
    err = db.QueryRow(query, ${inputs}).Scan(${scanInto})
    
    if err == sql.ErrNoRows {
       http.Error(w, "Record not found for this ${endpoint.go.real.name}", http.StatusNotFound)
       return
    } else if err != nil {
       http.Error(w, "Error fetching ${endpoint.go.real.name}: "+err.Error(), http.StatusInternalServerError)
       return
    }`;
                return str.trim();
        }
}
