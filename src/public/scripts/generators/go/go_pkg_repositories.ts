import { SnakeToPascal } from '../../core/formatting';
import { CodeGenerator, Endpoint, SqlTable } from '../../core/structure';
import { SqlGenerator } from './../sql/postgres_sql';

export class GoPkgRepositories extends CodeGenerator {
        Run() {
                let schemas = this.input;

                let pkg = `package repositories

import (
    "database/sql"
    "myapp/pkg/models"
)`;

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

                                let allParts: string[] = [pkg];

                                if (!table.endpoints.goShow) {
                                        console.error('missing table.endpoints.goShow');
                                        continue;
                                }

                                let repo = `type ${table.endpoints.goShow.repo.type} struct {
    DB *sql.DB
}`;

                                allParts.push(repo);

                                if (table.endpoints.create !== null) {
                                        for (let m = 0; m < table.endpoints.create.length; m++) {
                                                const endpoint = table.endpoints.create[m];

                                                goEndpoints.push({
                                                        name: endpoint.go.fnName,
                                                        method: 'post',
                                                        path: endpoint.path,
                                                });

                                                let str = GoPkgRepositories.GenerateCreateSnippet(endpoint);
                                                allParts.push(str);
                                        }
                                }
                                if (table.endpoints.read !== null) {
                                        for (let m = 0; m < table.endpoints.read.length; m++) {
                                                const endpoint = table.endpoints.read[m];

                                                goEndpoints.push({
                                                        name: endpoint.go.fnName,
                                                        method: 'get',
                                                        path: endpoint.path,
                                                });

                                                let str = GoPkgRepositories.GenerateReadSnippet(endpoint, table);
                                                allParts.push(str);
                                        }
                                }
                                if (table.endpoints.update !== null) {
                                        for (let m = 0; m < table.endpoints.update.length; m++) {
                                                const endpoint = table.endpoints.update[m];

                                                goEndpoints.push({
                                                        name: endpoint.go.fnName,
                                                        method: 'put',
                                                        path: endpoint.path,
                                                });

                                                let str = GoPkgRepositories.GenerateUpdateSnippet(endpoint);
                                                allParts.push(str);
                                        }
                                }
                                if (table.endpoints.delete !== null) {
                                        for (let m = 0; m < table.endpoints.delete.length; m++) {
                                                const endpoint = table.endpoints.delete[m];

                                                goEndpoints.push({
                                                        name: endpoint.go.fnName,
                                                        method: 'delete',
                                                        path: endpoint.path,
                                                });

                                                let str = GoPkgRepositories.GenerateDeleteSnippet(endpoint);
                                                allParts.push(str);
                                        }
                                }
                                let tableStr = allParts.join('\n\n');
                                this.output['/pkg/repositories/' + table.label + '.go'] = tableStr;
                        }
                }

                return this;
        }

        private static GenerateCreateSnippet(endpoint: Endpoint) {
                let inputsForQuery = endpoint.http.bodyIn.map((e) => `${endpoint.go.input.varName}.${e.go.typeName}`).join(', ');
                let scanInto = endpoint.sql.outputs.map((e) => `&${endpoint.go.output.varName}.${SnakeToPascal(e.sql.sqlLocation.column)}`).join(', ');
                let returnStuff = endpoint.sql.outputs.map((e) => `${endpoint.go.output.varName}.${SnakeToPascal(e.sql.sqlLocation.column)}`).join(', ');

                let str = `func (repo *${endpoint.repo.type}) ${endpoint.routerRepoName}(${endpoint.go.input.varName} *models.${endpoint.go.input.typeName}) (${
                        endpoint.sql.outputs[0].go.typeType
                }, error) {
    query := \`${SqlGenerator.GenerateACreateEndpoint(endpoint, true)}\`
    err := repo.DB.QueryRow(query, ${inputsForQuery}).Scan(${scanInto})
    return ${returnStuff}, err
}`;
                return str.trim();
        }

        private static GenerateReadSnippet(endpoint: Endpoint, table: SqlTable) {
                let scanInto = endpoint.sql.outputs.map((e) => `&${endpoint.go.output.varName}.${SnakeToPascal(e.sql.sqlLocation.column)}`).join(', ');
                let paramFromRouter = `${endpoint.primaryKeyEndpointParam.go.varName} ${endpoint.primaryKeyEndpointParam.go.typeType}`;

                let inputsForQuery = endpoint.http.path.map((e) => `${e.go.varName}`);
                let inputsForQuery2 = endpoint.http.bodyIn.map((e) => `${endpoint.go.input.varName}.${e.go.typeName}`);
                let inputs = [...inputsForQuery, ...inputsForQuery2].join(', ');

                // let inputs = endpoint.inputs.map((e) => `${endpoint.go.input.name}.${e.go.name}`);

                if (endpoint.many) {
                        let str = `func (repo *${endpoint.repo.type}) ${endpoint.routerRepoName}() ([]models.${endpoint.go.output.typeType}, error) {
    query := \`${SqlGenerator.GenerateAReadEndpoint(endpoint, table, true)}\`
    rows, err := repo.DB.Query(query)
     if err != nil {
         return nil, err
     }
     defer rows.Close()

     var ${endpoint.go.output.varName}s []models.${endpoint.go.output.typeType}
     for rows.Next() {
         var ${endpoint.go.output.varName} models.${endpoint.go.output.typeType}
         err := rows.Scan(${scanInto})
         if err != nil {
             return nil, err
         }
         ${endpoint.go.output.varName}s = append(${endpoint.go.output.varName}s, ${endpoint.go.output.varName})
     }

     return ${endpoint.go.output.varName}s, err
}`;
                        return str.trim();
                }

                // var ${endpoint.go.input.name} ${endpoint.go.input.type}
                let str = `func (repo *${endpoint.repo.type}) ${endpoint.routerRepoName}(${paramFromRouter}) (models.${endpoint.go.output.typeType}, error) {
    query := \`${SqlGenerator.GenerateAReadEndpoint(endpoint, table, true)}\`
    
    var ${endpoint.go.output.varName} models.${endpoint.go.output.typeType}
    err := repo.DB.QueryRow(query, ${inputs}).Scan(${scanInto})
    
    return ${endpoint.go.output.varName}, err
}`;
                return str.trim();
        }

        private static GenerateUpdateSnippet(endpoint: Endpoint) {
                // here as its the repo we want id in the body too, so we treat it the same
                let pathAttrs = endpoint.http.path.map((e) => `${endpoint.go.input.varName}.${e.go.typeName}`);
                let bodyAttrs = endpoint.http.bodyIn.map((e) => `${endpoint.go.input.varName}.${e.go.typeName}`);
                let inputs = [...pathAttrs, ...bodyAttrs].join(', ');

                let str = `func (repo *${endpoint.repo.type}) ${endpoint.routerRepoName}(${endpoint.go.input.varName} *models.${
                        endpoint.go.input.typeName
                }) error {
    query := \`${SqlGenerator.GenerateAUpdateEndpoint(endpoint, true)}\`
    _, err := repo.DB.Exec(query, ${inputs})
    return err
}`;
                return str.trim();
        }

        private static GenerateDeleteSnippet(endpoint: Endpoint) {
                let inputs = endpoint.http.path.map((e) => `${e.go.varName}`).join(', ');
                let paramFromRouter = `${endpoint.primaryKeyEndpointParam.go.varName} ${endpoint.primaryKeyEndpointParam.go.typeType}`;

                let str = `func (repo *${endpoint.repo.type}) ${endpoint.routerRepoName}(${paramFromRouter}) error {
    query := \`${SqlGenerator.GenerateADeleteEndpoint(endpoint, true)}\`
    _, err := repo.DB.Exec(query, ${inputs})
    return err
}`;
                return str.trim();
        }
}
