import { CodeGenerator, CodeLogic, REPLACE_PHRASE, SqlTable } from '../core/structure';
import { GoTypesCodeGenerator } from './go_struct';
import { SqlGenerator } from './postgres_sql';

export class GoApiCodeGenerator extends CodeGenerator {
        goStructs = new GoTypesCodeGenerator();

        Run() {
                let goStructs = this.goStructs.Clear().SetInput(this.input).Run().Read();

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

${goStructs}

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

                let endpoints: {
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

                                if (table.logic.create !== null) {
                                        for (let m = 0; m < table.logic.create.length; m++) {
                                                const create = table.logic.create[m];

                                                endpoints.push({
                                                        name: create.go.fnName,
                                                        method: 'post',
                                                        path: `/${create.sqlSchemaName}/${create.go.real.name}`,
                                                });

                                                let str = GoApiCodeGenerator.GenerateCreateSnippet(create);
                                                allParts.push(str);
                                        }
                                }
                                if (table.logic.read !== null) {
                                        for (let m = 0; m < table.logic.read.length; m++) {
                                                const read = table.logic.read[m];

                                                endpoints.push({
                                                        name: read.go.fnName,
                                                        method: 'get',
                                                        path: `/${read.sqlSchemaName}/${read.go.real.name}`,
                                                });

                                                let str = GoApiCodeGenerator.GenerateReadSnippet(read, table);
                                                allParts.push(str);
                                        }
                                }
                                if (table.logic.update !== null) {
                                        for (let m = 0; m < table.logic.update.length; m++) {
                                                const update = table.logic.update[m];

                                                endpoints.push({
                                                        name: update.go.fnName,
                                                        method: 'put',
                                                        path: `/${update.sqlSchemaName}/${update.go.real.name}`,
                                                });

                                                let str = GoApiCodeGenerator.GenerateUpdateSnippet(update);
                                                allParts.push(str);
                                        }
                                }
                                if (table.logic.delete !== null) {
                                        for (let m = 0; m < table.logic.delete.length; m++) {
                                                const del = table.logic.delete[m];

                                                endpoints.push({
                                                        name: del.go.fnName,
                                                        method: 'delete',
                                                        path: `/${del.sqlSchemaName}/${del.go.real.name}`,
                                                });

                                                let str = GoApiCodeGenerator.GenerateDeleteSnippet(del);
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

                for (let i = 0; i < endpoints.length; i++) {
                        const endpoint = endpoints[i];
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
                                        ? `case http.MethodGet:
            ${endpoint['get']}(w, r)`
                                        : '',

                                endpoint['post']
                                        ? `case http.MethodPost:
            ${endpoint['post']}(w, r)`
                                        : '',

                                endpoint['put']
                                        ? `case http.MethodPut:
            ${endpoint['put']}(w, r)`
                                        : '',

                                endpoint['delete']
                                        ? `case http.MethodDelete:
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

                this.output = allParts.join('\n\n');

                return this;
        }

        private static GenerateCreateSnippet(logic: CodeLogic) {
                let inputsForQuery = logic.inputs.map((e) => `${logic.go.input.varName}.${e.go.typeName}`);
                let str = `func ${logic.go.fnName}(w http.ResponseWriter, r *http.Request) {
    var ${logic.go.input.varName} ${logic.go.input.typeType}
    if err := json.NewDecoder(r.Body).Decode(&${logic.go.input.varName}); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    query := \`${SqlGenerator.GenerateACreateLogic(logic, true)}\`

    var ${logic.go.output.varName} ${logic.go.output.typeType}

    err := db.QueryRow(query, ${inputsForQuery}).Scan(&${logic.go.output.varName})
    if err != nil {
        http.Error(w, "Error inserting: ${logic.go.real.name}"+err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(${logic.go.output.varName})
}`;
                return str.trim();
        }

        private static GenerateReadSnippet(logic: CodeLogic, table: SqlTable) {
                let pkVars = logic.inputs
                        .filter((e) => e.primary)
                        .map((e) =>
                                e.go.typeType === 'string'
                                        ? `${e.go.varName} := r.URL.Query().Get("${e.sql.name}");`
                                        : `${e.go.varName}Str := r.URL.Query().Get("${e.sql.name}")
    ${e.go.varName}, err := ${e.go.parser.replace(REPLACE_PHRASE, `${e.go.varName}Str`)}
    if err != nil {
        http.Error(w, "Invalid ${e.sql.name}", http.StatusBadRequest)
        return
    }`
                        );

                let inputsForQuery = logic.inputs.filter((e) => e.primary).map((e) => `${e.go.varName}`);
                let inputsForQuery2 = logic.inputs.filter((e) => !e.primary).map((e) => `${logic.go.input.varName}.${e.go.typeName}`);
                let inputs = [...inputsForQuery, ...inputsForQuery2].join(', ');

                // let inputs = logic.inputs.map((e) => `${logic.go.input.name}.${e.go.name}`);

                if (inputs.length === 0) {
                        let str = `func ${logic.go.fnName}(w http.ResponseWriter, r *http.Request) {
                                query := \`${SqlGenerator.GenerateAReadLogic(logic, table, true)}\`
                                
                                var ${logic.go.output.varName} ${logic.go.output.typeType}
                                err := db.QueryRow(query, ${inputs}).Scan(&${logic.go.output.varName})
                                
                                if err == sql.ErrNoRows {
                                    http.Error(w, "Record not found for this ${logic.go.real.name}", http.StatusNotFound)
                                    return
                                } else if err != nil {
                                    http.Error(w, "Error fetching ${logic.go.real.name}: "+err.Error(), http.StatusInternalServerError)
                                    return
                                }
                            
                                json.NewEncoder(w).Encode(${logic.go.output.varName})
                            }`;
                        return str.trim();
                }

                // var ${logic.go.input.name} ${logic.go.input.type}

                let str = `func ${logic.go.fnName}(w http.ResponseWriter, r *http.Request) {
    ${pkVars.join('\n\n    ')}

    query := \`${SqlGenerator.GenerateAReadLogic(logic, table, true)}\`
    
    var ${logic.go.output.varName} ${logic.go.output.typeType}
    err = db.QueryRow(query, ${inputs}).Scan(&${logic.go.output.varName})
    
    if err == sql.ErrNoRows {
        http.Error(w, "Record not found for this ${logic.go.real.name}", http.StatusNotFound)
        return
    } else if err != nil {
        http.Error(w, "Error fetching ${logic.go.real.name}: "+err.Error(), http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(${logic.go.output.varName})
}`;
                return str.trim();
        }

        private static GenerateUpdateSnippet(logic: CodeLogic) {
                //     let pkVars = logic.inputs
                //         .filter((e) => e.primary)
                //         .map(
                //             (e) => `${e.go.name}Str := r.URL.Query().Get("${e.sql.name}")
                // ${e.go.name}, err := strconv.Atoi(${e.go.name}Str)  // todo convert into not just number
                // if err != nil {
                //     http.Error(w, "Invalid ${e.sql.name}", http.StatusBadRequest)
                //     return
                // }`
                // );

                // let inputsForQuery = logic.inputs.filter((e) => e.primary).map((e) => `${e.go.name}`);
                // let inputsForQuery2 = logic.inputs.filter((e) => !e.primary).map((e) => `${logic.go.input.name}.${e.go.name}`);
                // let inputs = [...inputsForQuery, ...inputsForQuery2].join(', ');

                let inputs = logic.inputs.map((e) => `${logic.go.input.varName}.${e.go.typeName}`);

                // ${pkVars.join('\n\n    ')}
                let str = `func ${logic.go.fnName}(w http.ResponseWriter, r *http.Request) {
    var ${logic.go.input.varName} ${logic.go.input.typeType}
    if err := json.NewDecoder(r.Body).Decode(&${logic.go.input.varName}); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    query := \`${SqlGenerator.GenerateAUpdateLogic(logic, true)}\`

    res, err := db.Exec(query, ${inputs})
    if err != nil {
        http.Error(w, "Error updating ${logic.go.real.name}: "+err.Error(), http.StatusInternalServerError)
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

        private static GenerateDeleteSnippet(logic: CodeLogic) {
                //     let pkVars = logic.inputs
                //         .filter((e) => e.primary)
                //         .map(
                //             (e) => `${e.go.name}Str := r.URL.Query().Get("${e.sql.name}")
                // ${e.go.name}, err := strconv.Atoi(${e.go.name}Str)  // todo convert into not just number
                // if err != nil {
                //     http.Error(w, "Invalid ${e.sql.name}", http.StatusBadRequest)
                //     return
                // }`
                //         );

                // let inputsForQuery = logic.inputs.filter((e) => e.primary).map((e) => `${e.go.name}`);
                // let inputsForQuery2 = logic.inputs.filter((e) => !e.primary).map((e) => `${e.go.name}`);
                // let inputs = [...inputsForQuery, ...inputsForQuery2].join(', ');

                let inputs = logic.inputs.map((e) => `${logic.go.input.varName}.${e.go.typeName}`);

                // ${pkVars.join('\n\n    ')}
                let str = `func ${logic.go.fnName}(w http.ResponseWriter, r *http.Request) {
    var ${logic.go.input.varName} ${logic.go.input.typeType}
    if err := json.NewDecoder(r.Body).Decode(&${logic.go.input.varName}); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    query := \`${SqlGenerator.GenerateADeleteLogic(logic, true)}\`

    res, err := db.Exec(query, ${inputs})
    if err != nil {
        http.Error(w, "Error deleting: ${logic.go.real.name}"+err.Error(), http.StatusInternalServerError)
        return
    }

    rowsAffected, err := res.RowsAffected()
    if err != nil || rowsAffected == 0 {
        http.Error(w, "Record not found", http.StatusNotFound)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}`;
                return str.trim();
        }
}
