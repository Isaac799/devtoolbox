import { alignKeyword, alignKeywords, SnakeToPascal, SnakeToTitle } from '../core/formatting';
import { CodeGenerator, SQL_TO_TS_TYPE, SqlTable } from '../core/structure';

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

                                outputStack.push(`\n// * ${table.label}\n`);

                                let logics: Array<'create' | 'read' | 'update' | 'delete'> = ['create', 'read', 'update', 'delete'];

                                for (const logic of logics) {
                                        let stuff = this.CreateLogic(table, logic);
                                        outputStack = outputStack.concat(stuff);
                                }

                                stack.push(`export type ${SnakeToTitle(tableName)} = {`);
                                for (const attr of table.logic.existsAs) {
                                        stack.push(`    ${attr.typescript.name}: ${attr.typescript.type};`);
                                }
                                stack.push('}');

                                outputStack.push(this.FormatStack(stack).join(`\n`));
                                stack = [];
                        }
                }

                return outputStack.join('\n').trim();
        }

        private CreateLogic(table: SqlTable, what: 'create' | 'read' | 'update' | 'delete') {
                let stack: string[] = [];
                let outputStack: string[] = [];

                if (table.logic[what]) {
                        for (const logic of table.logic[what]) {
                                if (logic.inputs.length === 0) continue;
                                stack.push(`export type ${SnakeToPascal(`request_${logic.name}`)} = {`);
                                for (const el of logic.inputs) {
                                        stack.push(`    ${el.typescript.name}: ${el.typescript.type};`);
                                }
                                stack.push('}');
                                outputStack.push(this.FormatStack(stack).join('\n'));
                                stack = [];
                        }
                }
                if (table.logic[what]) {
                        for (const logic of table.logic[what]) {
                                if (logic.outputs.length === 0) continue;
                                stack.push(`export type ${SnakeToPascal(`response_${logic.name}`)} = {`);
                                for (const el of logic.outputs) {
                                        stack.push(`    ${el.typescript.name}: ${el.typescript.type};`);
                                }
                                stack.push('}');
                                outputStack.push(this.FormatStack(stack).join('\n'));
                                stack = [];
                        }
                }
                return outputStack;
        }

        Run() {
                let tsTypes = this.GenerateTsTypes();
                this.output = {
                        'structure.ts': tsTypes,
                };
                return this;
        }
}
