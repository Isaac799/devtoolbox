import { alignKeyword, alignKeywords, SnakeToTitle } from '../../core/formatting';
import { CodeGenerator, SQL_TO_TS_TYPE } from '../../core/structure';

export class TsTypesCodeGenerator extends CodeGenerator {
        FormatStack(stack: string[]) {
                let colis = alignKeyword(stack, ': ');
                let types = alignKeywords(colis, Object.values(SQL_TO_TS_TYPE));
                return types;
        }

        GenerateTsTypes(): string {
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

                                stack.push(`export type ${SnakeToTitle(tableName)} = {`);
                                for (const attr of table.endpoints.existsAs) {
                                        stack.push(`    ${attr.typescript.name}: ${attr.typescript.type};`);
                                }
                                stack.push('}');

                                outputStack.push(this.FormatStack(stack).join(`\n`));
                                stack = [];
                        }
                }

                return outputStack.join('\n').trim();
        }

        Run() {
                let tsTypes = this.GenerateTsTypes();
                this.output = {
                        'structure.ts': tsTypes,
                };
                return this;
        }
}
