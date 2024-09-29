import { SnakeToPascal, trimAndRemoveBlankStrings } from '../core/formatting';
import { CodeGenerator, Endpoint, EndpointParam, SqlTable } from '../core/structure';
import { GoTypesCodeGenerator } from './go_struct';
import { SqlGenerator } from './postgres_sql';

export class GoApiCodeGenerator extends CodeGenerator {
        goStructs = new GoTypesCodeGenerator();

        Run() {
                let schemas = this.input;
                let allParts: string[] = [];
                let headerInfo = `package main

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"

    _ "github.com/lib/pq"
)

var db *sql.DB

func initDB() {
    var err error
    connStr := "user=username dbname=mydb sslmode=disable"
    db, err = sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal(err)
    }
}`;
                allParts.push(headerInfo);

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

                                if (table.entityEndpoints.create !== null) {
                                        for (let m = 0; m < table.entityEndpoints.create.length; m++) {
                                                const endpoint = table.entityEndpoints.create[m];

                                                goEndpoints.push({
                                                        name: endpoint.go.fnName,
                                                        method: 'post',
                                                        path: `/${endpoint.sqlSchemaName}/${endpoint.go.real.name}`,
                                                });

                                                let str = GoApiCodeGenerator.GenerateCreateSnippet(endpoint);
                                                allParts.push(str);
                                        }
                                }
                                if (table.entityEndpoints.read !== null) {
                                        for (let m = 0; m < table.entityEndpoints.read.length; m++) {
                                                const endpoint = table.entityEndpoints.read[m];

                                                let endpointPath = `/${endpoint.sqlSchemaName}/${endpoint.go.real.name}`;
                                                if (!endpoint.many) {
                                                        endpointPath += '/:id';
                                                }

                                                goEndpoints.push({
                                                        name: endpoint.go.fnName,
                                                        method: 'get',
                                                        path: endpointPath,
                                                });

                                                let str = GoApiCodeGenerator.GenerateReadSnippet(endpoint, table);
                                                allParts.push(str);
                                        }
                                }
                                if (table.entityEndpoints.update !== null) {
                                        for (let m = 0; m < table.entityEndpoints.update.length; m++) {
                                                const endpoint = table.entityEndpoints.update[m];
                                                let endpointPath = `/${endpoint.sqlSchemaName}/${endpoint.go.real.name}`;
                                                endpointPath += '/:id';

                                                goEndpoints.push({
                                                        name: endpoint.go.fnName,
                                                        method: 'put',
                                                        path: endpointPath,
                                                });

                                                let str = GoApiCodeGenerator.GenerateUpdateSnippet(endpoint);
                                                allParts.push(str);
                                        }
                                }
                                if (table.entityEndpoints.delete !== null) {
                                        for (let m = 0; m < table.entityEndpoints.delete.length; m++) {
                                                const endpoint = table.entityEndpoints.delete[m];
                                                let endpointPath = `/${endpoint.sqlSchemaName}/${endpoint.go.real.name}`;
                                                endpointPath += '/:id';

                                                goEndpoints.push({
                                                        name: endpoint.go.fnName,
                                                        method: 'delete',
                                                        path: endpointPath,
                                                });

                                                let str = GoApiCodeGenerator.GenerateDeleteSnippet(endpoint);
                                                allParts.push(str);
                                        }
                                }
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

                const main = `func main() {
    initDB()
    defer db.Close()
${endpointStrs.join('\n')}
    
    log.Fatal(http.ListenAndServe(":8080", nil))
}`;

                allParts.push(main);

                let goStructs = this.goStructs.Clear().SetInput(this.input).Run().Read();
                goStructs = trimAndRemoveBlankStrings(goStructs);
                for (const key in goStructs) {
                        if (!Object.prototype.hasOwnProperty.call(goStructs, key)) {
                                continue;
                        }
                        goStructs[key] = `package main\n\n${goStructs[key]}`;
                }

                this.output = {
                        'main.go': allParts.join('\n\n'),
                        ...goStructs,
                };

                return this;
        }

        private static GenerateCreateSnippet(endpoint: Endpoint) {
                let inputsForQuery = endpoint.http.bodyIn.map((e) => `${endpoint.go.input.varName}.${e.go.typeName}`).join(', ');
                let scanInto = endpoint.sql.outputs.map((e) => `&${endpoint.go.output.varName}.${SnakeToPascal(e.sql.sqlLocation.column)}`).join(', ');
                let str = `func ${endpoint.go.fnName}(w http.ResponseWriter, r *http.Request) {
    var ${endpoint.go.input.varName} ${endpoint.go.input.typeType}
    if err := json.NewDecoder(r.Body).Decode(&${endpoint.go.input.varName}); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    query := \`${SqlGenerator.GenerateACreateEndpoint(endpoint, true)}\`

    err := db.QueryRow(query, ${inputsForQuery}).Scan(${scanInto})
    if err != nil {
        http.Error(w, "Error inserting: ${endpoint.go.real.name}"+err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(${endpoint.go.output.varName})
}`;
                return str.trim();
        }

        private static GenerateReadSnippet(endpoint: Endpoint, table: SqlTable) {
                let scanInto = endpoint.sql.outputs.map((e) => `&${endpoint.go.output.varName}.${SnakeToPascal(e.sql.sqlLocation.column)}`).join(', ');

                let variablesFromPath = GoApiCodeGenerator.ParseFromPath(endpoint.http.path);

                let inputsForQuery = endpoint.http.path.map((e) => `${e.go.varName}`);
                let inputsForQuery2 = endpoint.http.bodyIn.map((e) => `${endpoint.go.input.varName}.${e.go.typeName}`);
                let inputs = [...inputsForQuery, ...inputsForQuery2].join(', ');

                // let inputs = endpoint.inputs.map((e) => `${endpoint.go.input.name}.${e.go.name}`);

                if (endpoint.many) {
                        let str = `func ${endpoint.go.fnName}(w http.ResponseWriter, r *http.Request) {
    query := \`${SqlGenerator.GenerateAReadEndpoint(endpoint, table, true)}\`
    rows, err := db.Query(query, ${inputs})
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
     }

     w.Header().Set("Content-Type", "application/json")
     json.NewEncoder(w).Encode(${endpoint.go.output.varName}s)                        
}`;
                        return str.trim();
                }

                if (inputs.length === 0) {
                        let str = `func ${endpoint.go.fnName}(w http.ResponseWriter, r *http.Request) {
    query := \`${SqlGenerator.GenerateAReadEndpoint(endpoint, table, true)}\`
    
    var ${endpoint.go.output.varName} ${endpoint.go.output.typeType}
    err := db.QueryRow(query, ${inputs}).Scan(${scanInto})
    
    if err == sql.ErrNoRows {
        http.Error(w, "Record not found for this ${endpoint.go.real.name}", http.StatusNotFound)
        return
    } else if err != nil {
        http.Error(w, "Error fetching ${endpoint.go.real.name}: "+err.Error(), http.StatusInternalServerError)
        return
    }
    
    json.NewEncoder(w).Encode(${endpoint.go.output.varName})
}`;
                        return str.trim();
                }

                // var ${endpoint.go.input.name} ${endpoint.go.input.type}

                let str = `func ${endpoint.go.fnName}(w http.ResponseWriter, r *http.Request) {
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
    }

    json.NewEncoder(w).Encode(${endpoint.go.output.varName})
}`;
                return str.trim();
        }

        private static GenerateUpdateSnippet(endpoint: Endpoint) {
                let pathAttrs = endpoint.http.path.map((e) => `${e.go.varName}`);
                let bodyAttrs = endpoint.http.bodyIn.map((e) => `${endpoint.go.input.varName}.${e.go.typeName}`);
                let inputs = [...pathAttrs, ...bodyAttrs].join(', ');
                let variablesFromPath = GoApiCodeGenerator.ParseFromPath(endpoint.http.path);

                let str = `func ${endpoint.go.fnName}(w http.ResponseWriter, r *http.Request) {
    ${variablesFromPath}

    var ${endpoint.go.input.varName} ${endpoint.go.input.typeType}
    if err := json.NewDecoder(r.Body).Decode(&${endpoint.go.input.varName}); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    query := \`${SqlGenerator.GenerateAUpdateEndpoint(endpoint, true)}\`

    res, err := db.Exec(query, ${inputs})
    if err != nil {
        http.Error(w, "Error updating ${endpoint.go.real.name}: "+err.Error(), http.StatusInternalServerError)
        return
    }

    rowsAffected, err := res.RowsAffected()
    if err != nil || rowsAffected == 0 {
        http.Error(w, "Record not found or no changes made", http.StatusNotFound)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}`;
                return str.trim();
        }

        private static GenerateDeleteSnippet(endpoint: Endpoint) {
                let inputs = endpoint.http.path.map((e) => `${e.go.varName}`).join(', ');
                let variablesFromPath = GoApiCodeGenerator.ParseFromPath(endpoint.http.path);

                let str = `func ${endpoint.go.fnName}(w http.ResponseWriter, r *http.Request) {
    ${variablesFromPath}

    query := \`${SqlGenerator.GenerateADeleteEndpoint(endpoint, true)}\`
    
    res, err := db.Exec(query, ${inputs})
    if err != nil {
        http.Error(w, "Error deleting ${endpoint.go.real.name}: "+err.Error(), http.StatusInternalServerError)
        return
    }

    rowsAffected, err := res.RowsAffected()
    if err != nil || rowsAffected == 0 {
        http.Error(w, "Record not found or no changes made", http.StatusNotFound)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}`;
                return str.trim();
        }

        private static ParseFromPath(value: EndpointParam[]) {
                return value
                        .map((e) =>
                                e.go.typeType === 'string'
                                        ? `${e.go.varName} := r.URL.Query().Get("${e.sql.name}");`
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
