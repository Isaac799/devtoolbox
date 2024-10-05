import { CodeGenerator, Endpoint, EndpointParam, SqlTable } from '../../core/structure';
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

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'post',
                                        });

                                        let str = GoPkgRepositories.GenerateCreateSnippet(endpoint, table);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.read.single;

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'get',
                                        });

                                        let str = GoPkgRepositories.GenerateReadSingleSnippet(endpoint, table);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.read.many;

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'get',
                                        });

                                        let str = GoPkgRepositories.GenerateReadManySnippet(endpoint, table);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.update.single;

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'put',
                                        });

                                        let str = GoPkgRepositories.GenerateUpdateSnippet(endpoint, table);
                                        allParts.push(str);
                                }
                                {
                                        const endpoint = table.endpoints.delete.single;

                                        goEndpoints.push({
                                                name: endpoint.go.fnName,
                                                method: 'delete',
                                        });

                                        let str = GoPkgRepositories.GenerateDeleteSnippet(endpoint);
                                        allParts.push(str);
                                }
                                let tableStr = allParts.join('\n\n');
                                this.output['/pkg/repositories/' + table.label + '.go'] = tableStr;
                        }
                }

                this.output['/pkg/repositories/validation.go'] = GoPkgRepositories.validationTools;

                return this;
        }

        private static readonly validationTools = `package repositories
        
import "fmt"        
        
// ValidateNumber checks if the number is within the specified range (inclusive).
func ValidateNumber(num, min, max int) error {
	if num < min || num > max {
		return fmt.Errorf("number %d is out of range (%d to %d)", num, min, max)
	}
	return nil
}

// ValidateString checks if the string length is within the specified limits (inclusive).
func ValidateString(s string, minLen, maxLen int) error {
	length := len(s)
	if length < minLen || length > maxLen {
		return fmt.Errorf("string length %d is out of bounds (%d to %d)", length, minLen, maxLen)
	}
	return nil
}
        
// ValidateFloat64 checks if the float64 number is within the specified range (inclusive).
func ValidateFloat64(num float64, min, max float64) error {
	if num < min || num > max {
		return fmt.Errorf("float %f is out of range (%f to %f)", num, min, max)
	}
	return nil
}`;

        private static GenerateCreateSnippet(endpoint: Endpoint, table: SqlTable) {
                let inputsForQuery = endpoint.http.bodyIn.map((e) => `${endpoint.go.real.name}.${e.go.var.propertyName}`).join(', ');
                let scanInto = endpoint.sql.outputs.map((e) => `&${endpoint.go.real.name}.${e.go.var.propertyName}`).join(', ');
                let returnStuff = endpoint.sql.outputs.map((e) => `${endpoint.go.real.name}.${e.go.var.propertyName}`).join(', ');

                let validation = GoPkgRepositories.BuildVarValidation(endpoint, table.is, true, true);

                // because we declare err in the validation
                let queryRowPhrase = '';
                if (validation) {
                        queryRowPhrase = `err = repo.DB.QueryRow(query, ${inputsForQuery}).Scan(${scanInto})`;
                } else {
                        queryRowPhrase = `err := repo.DB.QueryRow(query, ${inputsForQuery}).Scan(${scanInto})`;
                }
                let str = `func (repo *${endpoint.repo.type}) ${endpoint.go.routerRepoName}(${endpoint.go.real.name} *models.${endpoint.go.real.type}) (${
                        endpoint.go.primaryKey.go.var.propertyGoType
                }, error) {
    ${validation}                
    query := \`${SqlGenerator.GenerateACreateEndpoint(endpoint, true)}\`
    ${queryRowPhrase}
    return ${returnStuff}, err
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

                let str = `func (repo *${endpoint.repo.type}) ${endpoint.go.routerRepoName}() ([]models.${endpoint.go.real.type}, error) {
    query := \`${SqlGenerator.GenerateAReadEndpoint(endpoint, table, true)}\`
    rows, err := repo.DB.Query(query)
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

        private static GenerateUpdateSnippet(endpoint: Endpoint, table: SqlTable) {
                // here as its the repo we want id in the body too, so we treat it the same
                let pathAttrs = endpoint.http.path.map((e) => `${endpoint.go.real.name}.${e.go.var.propertyName}`);
                let bodyAttrs = endpoint.http.bodyIn.map((e) => `${endpoint.go.real.name}.${e.go.var.propertyName}`);
                let inputs = [...pathAttrs, ...bodyAttrs].join(', ');
                let validation = GoPkgRepositories.BuildVarValidation(endpoint, table.is, true, false);

                // because we declare err in the validation
                let queryRowPhrase = '';
                if (validation) {
                        queryRowPhrase = `_, err = repo.DB.Exec(query, ${inputs})`;
                } else {
                        queryRowPhrase = `_, err := repo.DB.Exec(query, ${inputs})`;
                }

                let str = `func (repo *${endpoint.repo.type}) ${endpoint.go.routerRepoName}(${endpoint.go.real.name} *models.${endpoint.go.real.type}) error {
    ${validation}                
    query := \`${SqlGenerator.GenerateAUpdateEndpoint(endpoint, true)}\`
    ${queryRowPhrase}
    return err
}`;
                return str.trim();
        }

        private static GenerateDeleteSnippet(endpoint: Endpoint) {
                let inputs = endpoint.http.path.map((e) => `${e.go.var.propertyAsVariable}`).join(', ');
                let paramFromRouter = `${endpoint.go.primaryKey.go.var.propertyAsVariable} ${endpoint.go.primaryKey.go.var.propertyGoType}`;

                let str = `func (repo *${endpoint.repo.type}) ${endpoint.go.routerRepoName}(${paramFromRouter}) error {
    query := \`${SqlGenerator.GenerateADeleteEndpoint(endpoint, true)}\`
    _, err := repo.DB.Exec(query, ${inputs})
    return err
}`;
                return str.trim();
        }

        private static BuildVarValidation(endpoint: Endpoint, value: EndpointParam[], forCreate: boolean, returnValue: boolean) {
                let items = [...value];
                if (!forCreate) {
                        items = items.filter((e) => !e.readOnly);
                }
                return items
                        .filter((e) => e.validation.range)
                        .map((e, i) => {
                                let str = '';
                                let range = e.validation.range;
                                let returnVal = returnValue ? `${endpoint.go.primaryKey.go.stuff.emptyValue}, err` : 'err';
                                if (range) {
                                        let declare = i === 0 ? 'err :=' : 'err =';
                                        if (e.go.var.propertyGoType === 'string') {
                                                str = `${declare} ValidateString(${endpoint.go.real.name}.${e.go.var.propertyName}, ${range.min}, ${range.max})
    if err != nil {
        return ${returnVal}
    }`;
                                        } else if (e.go.var.propertyGoType === 'float64') {
                                                str = `${declare} ValidateFloat64(${endpoint.go.real.name}.${e.go.var.propertyName}, ${range.min}, ${range.max})
    if err != nil {
        return ${returnVal}
    }`;
                                        } else {
                                                str = `${declare} ValidateNumber(${endpoint.go.real.name}.${e.go.var.propertyName}, ${range.min}, ${range.max})
    if err != nil {
        return ${returnVal}
    }`;
                                        }
                                }

                                return str;
                        })
                        .join('\n\n    ');
        }
}
