import { alignKeyword, alignKeywords, SnakeToPascal } from '../core/formatting';
import { CodeGenerator, SQL_TO_GO_TYPE } from '../core/structure';

export class GoTypesCodeGenerator extends CodeGenerator {
        FormatStack(stack: string[]) {
                let types = alignKeywords(
                        stack,
                        Object.values(SQL_TO_GO_TYPE).map((e) => e.goType)
                );
                let jsons = alignKeyword(types, '`json:');
                return jsons;
        }

        GenerateGoTypes(): string {
                let schemas = this.input;

                let outputStack: string[] = [];
                let stack: string[] = [];

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

                                stack.push(`type ${SnakeToPascal(tableName)} struct {`);
                                for (const attr of table.entityEndpoints.existsAs) {
                                        stack.push(`    ${attr.go.typeName} ${attr.go.typeType} \`json:"${attr.sql.name}"\``);
                                }

                                stack.push('}');
                                outputStack.push(this.FormatStack(stack).join(`\n`));
                                stack = [];
                        }
                }

                return outputStack.join('\n').trim();
        }

        Run() {
                let goTypes = this.GenerateGoTypes();
                this.output = {
                        'structure.go': goTypes,
                };
                return this;
        }
}
