import { trimAndRemoveBlankStrings } from '../core/formatting';
import { CodeGenerator, Endpoint } from '../core/structure';
import { TsTypesCodeGenerator } from './ts_types';

function ConvertNameToEndpoint(value: string) {
        return value.replace(/read_|create_|update_|delete_/g, '').replace(/_/g, '-');
}

function CreateQueryParams2(where: string, endpoint: Endpoint) {
        let fields: string[] = [];
        for (let i = 0; i < endpoint.http.path.length; i++) {
                const element = endpoint.http.path[i];
                fields.push(`req.${where}.${element.typescript.name}`);
        }
        let fieldsStr = fields.join(', ');
        let input = `[${fieldsStr}]`;
        return input;
}

function CreateQueryParams(endpoint: Endpoint) {
        let placeholders: string[] = [];
        for (let i = 0; i < endpoint.http.path.length; i++) {
                // const element = endpoint.inputs[i];
                placeholders.push(`$${i + 1}`);
        }
        let placeholderStr = placeholders.join(', ');
        let input = `(${placeholderStr})`;
        return input;
}
function CreatePreCheckParams(where: string, endpoint: Endpoint) {
        let placeholders: string[] = [];
        for (let i = 0; i < endpoint.http.path.length; i++) {
                const element = endpoint.http.path[i];
                placeholders.push(`Needs("${element.typescript.name}", "${where}")`);
        }
        let placeholderStr = placeholders.join(',\n    ');
        let input = `${placeholderStr}`;
        return input;
}

export class NodeExpressCodeGenerator extends CodeGenerator {
        tsTypes = new TsTypesCodeGenerator();

        Run() {
                let schemas = this.input;
                let allParts: string[] = [];
                let headerInfo = `const express = require("express");
const pg = require("pg");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

const pool = new Pool({
  user: 'your_user',         
  host: 'localhost',         
  database: 'your_database', 
  password: 'your_password', 
  port: 5432,                
});

function Needs(key, where) {
    return (req, res, next) => {
        if (req[where][key] === undefined) {
            res.status(400).send(
                    \`missing \${key} from \${where}\`
            );
            return;
        }
        next();
        return;
    };
}`;
                allParts.push(headerInfo);

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

                                if (table.endpoints.create !== null) {
                                        for (let m = 0; m < table.endpoints.create.length; m++) {
                                                const create = table.endpoints.create[m];

                                                let str = NodeExpressCodeGenerator.GenerateCreateSnippet(create);
                                                allParts.push(str);
                                        }
                                }
                                if (table.endpoints.read !== null) {
                                        for (let m = 0; m < table.endpoints.read.length; m++) {
                                                const read = table.endpoints.read[m];

                                                let str = NodeExpressCodeGenerator.GenerateReadSnippet(read);
                                                allParts.push(str);
                                        }
                                }
                                if (table.endpoints.update !== null) {
                                        for (let m = 0; m < table.endpoints.update.length; m++) {
                                                const update = table.endpoints.update[m];

                                                let str = NodeExpressCodeGenerator.GenerateUpdateSnippet(update);
                                                allParts.push(str);
                                        }
                                }
                                if (table.endpoints.delete !== null) {
                                        for (let m = 0; m < table.endpoints.delete.length; m++) {
                                                const del = table.endpoints.delete[m];

                                                let str = NodeExpressCodeGenerator.GenerateDeleteSnippet(del);
                                                allParts.push(str);
                                        }
                                }
                        }
                }

                allParts.push(`app.listen(PORT, () => {
  console.log(\`Server is running on http://localhost:\${PORT}\`);
});`);

                let tsTypes = this.tsTypes.Clear().SetInput(this.input).Run().Read();
                tsTypes = trimAndRemoveBlankStrings(tsTypes);
                for (const key in tsTypes) {
                        if (!Object.prototype.hasOwnProperty.call(tsTypes, key)) {
                                continue;
                        }
                        tsTypes[key] = `package main\n\n${tsTypes[key]}`;
                }

                this.output = {
                        'server.js': allParts.join('\n'),
                        ...tsTypes,
                };

                return this;
        }

        private static GenerateDeleteSnippet(del: Endpoint) {
                let endpoint = ConvertNameToEndpoint(del.http.name);
                let params = CreateQueryParams(del);
                let where = 'body';
                let str = `app.delete("/${endpoint}",
    ${CreatePreCheckParams(where, del)}, 
    (req, res) => {                                                     
    let query = \`call ${del.http.name}${params}\`;                                                        
    pool.query(query, ${CreateQueryParams2(where, del)})
        .then((postgresResponse) => {
            res.status(200).json(postgresResponse.rows);
            return;
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(error.message || error.hint || "query failed");
            return;
        });
    return;                                              
});`;
                return str;
        }

        private static GenerateReadSnippet(read: Endpoint) {
                let endpoint = ConvertNameToEndpoint(read.http.name);
                let params = CreateQueryParams(read);
                let where = 'query';

                let preCheckParams =
                        read.http.path.length > 0
                                ? `
${CreatePreCheckParams(where, read)},`
                                : '';

                let str = `app.get("/${endpoint}", ${preCheckParams}
(req, res) => {                                                 
let query = \`select * from ${read.http.name}${params}\`;                                                        
pool.query(query, ${CreateQueryParams2(where, read)})
    .then((postgresResponse) => {
        res.status(200).json(postgresResponse.rows);
        return;
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send(error.message || error.hint || "query failed");
        return;
    });
return;                                              
});`;
                return str;
        }

        private static GenerateCreateSnippet(create: Endpoint) {
                let endpoint = ConvertNameToEndpoint(create.http.name);
                let params = CreateQueryParams(create);
                let where = 'body';
                let str = `app.post("/${endpoint}",
${CreatePreCheckParams(where, create)}, 
(req, res) => {
let query = \`call ${create.http.name}${params}\`;                                                        
pool.query(query, ${CreateQueryParams2(where, create)})
    .then((postgresResponse) => {
        res.status(200).json(postgresResponse.rows);
        return;
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send(error.message || error.hint || "query failed");
        return;
    });
return;                                              
});`;
                return str;
        }

        private static GenerateUpdateSnippet(update: Endpoint) {
                let endpoint = ConvertNameToEndpoint(update.http.name);
                let params = CreateQueryParams(update);
                let where = 'body';
                let str = `app.put("/${endpoint}",
    ${CreatePreCheckParams(where, update)}, 
    (req, res) => {                                                  
    let query = \`call ${update.http.name}${params}\`;                                                        
    pool.query(query, ${CreateQueryParams2(where, update)})
        .then((postgresResponse) => {
            res.status(200).json(postgresResponse.rows);
            return;
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(error.message || error.hint || "query failed");
            return;
        });
    return;                                              
});`;
                return str;
        }
}
