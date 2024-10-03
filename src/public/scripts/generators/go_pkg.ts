import { alignKeyword, alignKeywords, SnakeToPascal } from '../core/formatting';
import { CodeGenerator, SQL_TO_GO_TYPE } from '../core/structure';
import { GoRouter } from './go_router';

export class GoPkg extends CodeGenerator {
        FormatStack(stack: string[]) {
                let types = alignKeywords(
                        stack,
                        Object.values(SQL_TO_GO_TYPE).map((e) => e.goType)
                );
                let jsons = alignKeyword(types, '`json:');
                return jsons;
        }

        Run() {
                let schemas = this.input;
                let importsParts: string[] = [];

                for (const schemaName in schemas) {
                        if (!Object.prototype.hasOwnProperty.call(schemas, schemaName)) {
                                continue;
                        }
                        const schema = schemas[schemaName];

                        for (const tableName in schema.tables) {
                                if (!Object.prototype.hasOwnProperty.call(schema.tables, tableName)) {
                                        continue;
                                }
                                let outputStack: string[] = [];
                                let stack: string[] = [];

                                const table = schema.tables[tableName];
                                importsParts = importsParts.concat(GoRouter.GenerateImportsFormStruct(table.endpoints.existsAs));

                                stack.push(`type ${SnakeToPascal(tableName)} struct {`);
                                for (const attr of table.endpoints.existsAs) {
                                        stack.push(`    ${attr.go.typeName} ${attr.go.typeType} \`json:"${attr.sql.name}"\``);
                                }

                                stack.push('}');
                                outputStack.push(this.FormatStack(stack).join(`\n`));
                                stack = [];

                                importsParts = [...new Set(importsParts)];
                                let imports = importsParts
                                        .filter((e) => !!e)
                                        .map((e) => `"${e}"`)
                                        .join('\n');

                                let importStmt = '';

                                if (imports.length > 0) {
                                        importStmt = `
                                        
import (
    ${imports}
)`;
                                }

                                let pkg = `package models${importStmt}                                
                                `;
                                outputStack.unshift(pkg);

                                let fileContent = outputStack.join('\n').trim();
                                // this.output[`/pkg/${table.label}/${table.label}.go`] = `package models\n\n${fileContent}`;
                                this.output[`/pkg/models/${table.label}.go`] = `${fileContent}`;

                                this.output[`/pkg/services/${table.label}.go`] = `package services\n\n// add business logic here`;
                        }
                }

                return this;
        }
}
