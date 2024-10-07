import { CodeGenerator, Endpoint, SqlTable } from '../../core/structure';
import { SqlGenerator } from './../sql/postgres_sql';

export class GoPkgRepositories extends CodeGenerator {
        Run() {
                let schemas = this.input;

                let pkg = `package repositories

import (
    "database/sql"
    "myapp/pkg/validation"
    "myapp/pkg/models"
)`;

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
                                if (!table.endpoints) {
                                        continue;
                                }

                                let allParts: string[] = [pkg];

                                // any table repo name will do
                                let rpNm = table.endpoints.read.single.repo.type;
                                let repo = `type ${rpNm} struct {
    DB *sql.DB
}`;

                                allParts.push(repo);

                                {
                                        const endpoint = table.endpoints.create.single;
                                        let str = GoPkgRepositories.GenerateCreateSnippet(endpoint);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.read.single;
                                        let str = GoPkgRepositories.GenerateReadSingleSnippet(endpoint, table);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.read.many;
                                        let str = GoPkgRepositories.GenerateReadManySnippet(endpoint, table);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.update.single;
                                        let str = GoPkgRepositories.GenerateUpdateSnippet(endpoint);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.delete.single;
                                        let str = GoPkgRepositories.GenerateDeleteSnippet(endpoint);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.delete.single;
                                        let str = GoPkgRepositories.GenerateCountSnippet(endpoint);
                                        allParts.push(str);
                                }
                                let tableStr = allParts.join('\n\n');
                                this.output['/pkg/repositories/' + table.label + '.go'] = tableStr;
                        }
                }

                return this;
        }

        private static GenerateCreateSnippet(endpoint: Endpoint) {
                let inputsForQuery = endpoint.http.bodyIn.map((e) => `${endpoint.go.real.name}.${e.go.var.propertyName}`).join(', ');
                let scanInto = endpoint.sql.outputs.map((e) => `&${endpoint.go.real.name}.${e.go.var.propertyName}`).join(', ');
                let returns = `*validation.Changeset[models.${endpoint.go.real.type}]`;

                let str = `func (repo *${endpoint.repo.type}) ${endpoint.go.routerRepoName}(${endpoint.go.real.name} *models.${
                        endpoint.go.real.type
                }) ${returns} {
    changeset := ${endpoint.go.real.name}.${endpoint.changeSetName}()

    if !changeset.IsValid() {
        return &changeset
    }

    tx, err := repo.DB.Begin()
    if err != nil {
        changeset.Errors["transaction"] = err.Error()
        return &changeset
    }
                
    query := \`${SqlGenerator.GenerateACreateEndpoint(endpoint, true)}\`

    if err := tx.QueryRow(query, ${inputsForQuery}).Scan(${scanInto}); err != nil {
        if rollbackErr := tx.Rollback(); rollbackErr != nil {
            changeset.Errors["rollback"] = rollbackErr.Error()
        }
        changeset.Errors["postgres"] = err.Error()
        return &changeset
    }
    if err := tx.Commit(); err != nil {
        changeset.Errors["commit"] = err.Error()
    }
    return &changeset
}`;
                return str.trim();
        }

        private static GenerateReadSingleSnippet(endpoint: Endpoint, table: SqlTable) {
                let scanInto = endpoint.sql.outputs.map((e) => `&${endpoint.go.real.name}.${e.go.var.propertyName}`).join(', ');
                let paramFromRouter = `${endpoint.go.primaryKey.go.var.propertyAsVariable} ${endpoint.go.primaryKey.go.var.propertyGoType}`;

                let inputsForQuery = endpoint.http.path.map((e) => `${e.go.var.propertyAsVariable}`);
                let inputsForQuery2 = endpoint.http.bodyIn.map((e) => `${endpoint.go.real.name}.${e.go.var.propertyName}`);
                let inputs = [...inputsForQuery, ...inputsForQuery2].join(', ');

                let str = `func (repo *${endpoint.repo.type}) ${endpoint.go.routerRepoName}(${paramFromRouter}) (models.${endpoint.go.real.type}, error) {
    query := \`${SqlGenerator.GenerateAReadEndpoint(endpoint, table, true)}\`
    
    var ${endpoint.go.real.name} models.${endpoint.go.real.type}
    err := repo.DB.QueryRow(query, ${inputs}).Scan(${scanInto})
    
    return ${endpoint.go.real.name}, err
}`;
                return str.trim();
        }

        private static GenerateReadManySnippet(endpoint: Endpoint, table: SqlTable) {
                let scanInto = endpoint.sql.outputs.map((e) => `&${endpoint.go.real.name}.${e.go.var.propertyName}`).join(', ');
                let funcParams = `offset, limit int`;

                let str = `func (repo *${endpoint.repo.type}) ${endpoint.go.routerRepoName}(${funcParams}) ([]models.${endpoint.go.real.type}, error) {
    query := \`${SqlGenerator.GenerateAReadEndpoint(endpoint, table, true)}\`
    
    if limit > 100 {
        limit = 100
    }
    
    rows, err := repo.DB.Query(query, limit, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var ${endpoint.go.real.name}s []models.${endpoint.go.real.type}
    for rows.Next() {
        var ${endpoint.go.real.name} models.${endpoint.go.real.type}
        err := rows.Scan(${scanInto})
        if err != nil {
            return nil, err
        }
        ${endpoint.go.real.name}s = append(${endpoint.go.real.name}s, ${endpoint.go.real.name})
    }
    
    return ${endpoint.go.real.name}s, err
}`;
                return str.trim();
        }

        private static GenerateUpdateSnippet(endpoint: Endpoint) {
                // here as its the repo we want id in the body too, so we treat it the same
                let pathAttrs = endpoint.http.path.map((e) => `${endpoint.go.real.name}.${e.go.var.propertyName}`);
                let bodyAttrs = endpoint.http.bodyIn.map((e) => `${endpoint.go.real.name}.${e.go.var.propertyName}`);
                let inputs = [...pathAttrs, ...bodyAttrs].join(', ');
                let returns = `*validation.Changeset[models.${endpoint.go.real.type}]`;
                let funcParams = `${endpoint.go.real.name} *models.${endpoint.go.real.type}`;

                let str = `func (repo *${endpoint.repo.type}) ${endpoint.go.routerRepoName}(${funcParams}) ${returns} {
    changeset := ${endpoint.go.real.name}.${endpoint.changeSetName}()

    if !changeset.IsValid() {
        return &changeset
    }

    tx, err := repo.DB.Begin()
    if err != nil {
        changeset.Errors["transaction"] = err.Error()
        return &changeset
    }
                
    query := \`${SqlGenerator.GenerateAUpdateEndpoint(endpoint, true)}\`

    result, err := tx.Exec(query, ${inputs}); 
    if err != nil {
        if rollbackErr := tx.Rollback(); rollbackErr != nil {
            changeset.Errors["rollback"] = rollbackErr.Error()
        }
        changeset.Errors["postgres"] = err.Error()
        return &changeset
    }

    rowsAffected, err := result.RowsAffected()
    if err != nil {
        changeset.Errors["rowsAffected"] = err.Error()
    } else if rowsAffected == 0 {
        changeset.Errors["notFound"] = "no ${endpoint.go.real.name} record found with the given ${endpoint.go.primaryKey.go.var.propertyAsVariable}."
    }

    if err := tx.Commit(); err != nil {
        changeset.Errors["commit"] = err.Error()
    }
    return &changeset
}`;
                return str.trim();
        }

        private static GenerateDeleteSnippet(endpoint: Endpoint) {
                let inputs = endpoint.http.path.map((e) => `${endpoint.go.real.name}.${e.go.var.propertyName}`).join(', ');
                let returns = `*validation.Changeset[models.${endpoint.go.real.type}]`;
                let funcParams = `${endpoint.go.real.name} *models.${endpoint.go.real.type}`;

                // let paramFromRouter = `${endpoint.go.primaryKey.go.var.propertyAsVariable} ${endpoint.go.primaryKey.go.var.propertyGoType}`;

                let str = `func (repo *${endpoint.repo.type}) ${endpoint.go.routerRepoName}(${funcParams}) ${returns} {
    changeset := ${endpoint.go.real.name}.${endpoint.changeSetName}()

    if !changeset.IsValid() {
        return &changeset
    }

    tx, err := repo.DB.Begin()
    if err != nil {
        changeset.Errors["transaction"] = err.Error()
        return &changeset
    }
                
    query := \`${SqlGenerator.GenerateADeleteEndpoint(endpoint, true)}\`

    result, err := tx.Exec(query, ${inputs}); 
    if err != nil {
        if rollbackErr := tx.Rollback(); rollbackErr != nil {
            changeset.Errors["rollback"] = rollbackErr.Error()
        }
        changeset.Errors["postgres"] = err.Error()
        return &changeset
    }

    rowsAffected, err := result.RowsAffected()
    if err != nil {
        changeset.Errors["rowsAffected"] = err.Error()
    } else if rowsAffected == 0 {
        changeset.Errors["notFound"] = "no ${endpoint.go.real.name} record found with the given ${endpoint.go.primaryKey.go.var.propertyAsVariable}."
    }

    if err := tx.Commit(); err != nil {
        changeset.Errors["commit"] = err.Error()
    }
    return &changeset
}`;
                return str.trim();
        }

        private static GenerateCountSnippet(endpoint: Endpoint) {
                let str = `func (repo *${endpoint.repo.type}) GetTotalCount() (int, error) {
    var count int
    query := \`SELECT COUNT(*) FROM ${endpoint.tableFullName};\`
    err := repo.DB.QueryRow(query).Scan(&count)
    if err != nil {
        return 0, err
    }
    return count, nil
}`;

                return str.trim();
        }
}
