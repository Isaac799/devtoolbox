import { CodeGenerator, CodeLogic } from '../core/structure';

export class NodeExpressCodeGenerator extends CodeGenerator {
        Run() {
                let schemas = this.input;
                let bd: string[] = [];
                let headerInfo = `const express = require("express");
const pg = require("pg");
let app = express();
app.use(express.json());
const CONNECTION_STRING = process.env["myDatabase"];
pg.connect(CONNECTION_STRING);

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
}

`;
                bd.push(headerInfo);

                function ConvertNameToEndpoint(value: string) {
                        return value.replace(/read_|create_|update_|delete_/g, '').replace(/_/g, '-');
                }

                function CreateQueryParams2(where: string, logic: CodeLogic) {
                        let fields: string[] = [];
                        for (let i = 0; i < logic.inputs.length; i++) {
                                const element = logic.inputs[i];
                                fields.push(`req.${where}.${element.name}`);
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
                                placeholders.push(`Needs("${element.name}", "${where}")`);
                        }
                        let placeholderStr = placeholders.join(',\n    ');
                        let input = `${placeholderStr}`;
                        return input;
                }

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

                                                let endpoint = ConvertNameToEndpoint(create.name);
                                                let params = CreateQueryParams(create);
                                                let where = 'body';
                                                let str = `app.post("/${endpoint}",
    ${CreatePreCheckParams(where, create)}, 
    (req, res) => {
        let query = \`call ${create.name}${params}\`;                                                        
        pg.query(query, ${CreateQueryParams2(where, create)})
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
                                                bd.push(str);
                                        }
                                }
                                if (table.logic.read !== null) {
                                        for (let m = 0; m < table.logic.read.length; m++) {
                                                const read = table.logic.read[m];

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
        pg.query(query, ${CreateQueryParams2(where, read)})
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
                                                bd.push(str);
                                        }
                                }
                                if (table.logic.update !== null) {
                                        for (let m = 0; m < table.logic.update.length; m++) {
                                                const update = table.logic.update[m];

                                                let endpoint = ConvertNameToEndpoint(update.name);
                                                let params = CreateQueryParams(update);
                                                let where = 'body';
                                                let str = `app.put("/${endpoint}",
    ${CreatePreCheckParams(where, update)}, 
    (req, res) => {                                                  
    let query = \`call ${update.name}${params}\`;                                                        
    pg.query(query, ${CreateQueryParams2(where, update)})
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
                                                bd.push(str);
                                        }
                                }
                                if (table.logic.delete !== null) {
                                        for (let m = 0; m < table.logic.delete.length; m++) {
                                                const del = table.logic.delete[m];

                                                let endpoint = ConvertNameToEndpoint(del.name);
                                                let params = CreateQueryParams(del);
                                                let where = 'body';
                                                let str = `app.delete("/${endpoint}",
    ${CreatePreCheckParams(where, del)}, 
    (req, res) => {                                                     
    let query = \`call ${del.name}${params}\`;                                                        
    pg.query(query, ${CreateQueryParams2(where, del)})
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
                                                bd.push(str);
                                        }
                                }
                        }
                }

                if (bd.length === 0) {
                        this.output = 'please indicate a CRUD operation besides an entity';
                        return this;
                }

                this.output = bd.join('\n');

                return this;
        }
}
