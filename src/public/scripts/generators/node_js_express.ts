import { trimAndRemoveBlankStrings } from '../core/formatting';
import { CodeGenerator, CodeLogic } from '../core/structure';
import { TsTypesCodeGenerator } from './ts_types';

function ConvertNameToEndpoint(value: string) {
        return value.replace(/read_|create_|update_|delete_/g, '').replace(/_/g, '-');
}

function CreateQueryParams2(where: string, logic: CodeLogic) {
        let fields: string[] = [];
        for (let i = 0; i < logic.inputs.length; i++) {
                const element = logic.inputs[i];
                fields.push(`req.${where}.${element.typescript.name}`);
        }
        let fieldsStr = fields.join(', ');
        let input = `[${fieldsStr}]`;
        return input;
}

function CreateQueryParams(logic: CodeLogic) {
        let placeholders: string[] = [];
        for (let i = 0; i < logic.inputs.length; i++) {
                // const element = logic.inputs[i];
                placeholders.push(`$${i + 1}`);
        }
        let placeholderStr = placeholders.join(', ');
        let input = `(${placeholderStr})`;
        return input;
}
function CreatePreCheckParams(where: string, logic: CodeLogic) {
        let placeholders: string[] = [];
        for (let i = 0; i < logic.inputs.length; i++) {
                const element = logic.inputs[i];
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

                                if (table.logic.create !== null) {
                                        for (let m = 0; m < table.logic.create.length; m++) {
                                                const create = table.logic.create[m];

                                                let str = NodeExpressCodeGenerator.GenerateCreateSnippet(create);
                                                allParts.push(str);
                                        }
                                }
                                if (table.logic.read !== null) {
                                        for (let m = 0; m < table.logic.read.length; m++) {
                                                const read = table.logic.read[m];

                                                let str = NodeExpressCodeGenerator.GenerateReadSnippet(read);
                                                allParts.push(str);
                                        }
                                }
                                if (table.logic.update !== null) {
                                        for (let m = 0; m < table.logic.update.length; m++) {
                                                const update = table.logic.update[m];

                                                let str = NodeExpressCodeGenerator.GenerateUpdateSnippet(update);
                                                allParts.push(str);
                                        }
                                }
                                if (table.logic.delete !== null) {
                                        for (let m = 0; m < table.logic.delete.length; m++) {
                                                const del = table.logic.delete[m];

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

        private static GenerateDeleteSnippet(del: CodeLogic) {
                let endpoint = ConvertNameToEndpoint(del.name);
                let params = CreateQueryParams(del);
                let where = 'body';
                let str = `app.delete("/${endpoint}",
    ${CreatePreCheckParams(where, del)}, 
    (req, res) => {                                                     
    let query = \`call ${del.name}${params}\`;                                                        
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

        private static GenerateReadSnippet(read: CodeLogic) {
                let endpoint = ConvertNameToEndpoint(read.name);
                let params = CreateQueryParams(read);
                let where = 'query';

                let preCheckParams =
                        read.inputs.length > 0
                                ? `
${CreatePreCheckParams(where, read)},`
                                : '';

                let str = `app.get("/${endpoint}", ${preCheckParams}
(req, res) => {                                                 
let query = \`select * from ${read.name}${params}\`;                                                        
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

        private static GenerateCreateSnippet(create: CodeLogic) {
                let endpoint = ConvertNameToEndpoint(create.name);
                let params = CreateQueryParams(create);
                let where = 'body';
                let str = `app.post("/${endpoint}",
${CreatePreCheckParams(where, create)}, 
(req, res) => {
let query = \`call ${create.name}${params}\`;                                                        
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

        private static GenerateUpdateSnippet(update: CodeLogic) {
                let endpoint = ConvertNameToEndpoint(update.name);
                let params = CreateQueryParams(update);
                let where = 'body';
                let str = `app.put("/${endpoint}",
    ${CreatePreCheckParams(where, update)}, 
    (req, res) => {                                                  
    let query = \`call ${update.name}${params}\`;                                                        
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
