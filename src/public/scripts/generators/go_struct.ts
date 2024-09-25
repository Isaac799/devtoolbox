import { alignKeyword, alignKeywords, SnakeToPascal, SnakeToTitle } from '../core/formatting';
import { CodeGenerator, SQL_TO_GO_TYPE, SqlTable } from '../core/structure';

export class GoTypesCodeGenerator extends CodeGenerator {
        FormatStack(stack: string[]) {
                let types = alignKeywords(stack, Object.values(SQL_TO_GO_TYPE));
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

                                outputStack.push(`// ${table.label}`);

                                let logics: Array<'create' | 'read' | 'update' | 'delete'> = ['create', 'read', 'update', 'delete'];

                                for (const logic of logics) {
                                        let stuff = this.CreateLogic(table, logic);
                                        outputStack = outputStack.concat(stuff);
                                }

                                stack.push(`type ${SnakeToTitle(tableName)} struct {`);
                                for (const attr of table.logic.existsAs) {
                                        stack.push(`    ${attr.go.name} ${attr.go.type} \`json:"${attr.sql.name}"\``);
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
                                stack.push(`type ${SnakeToPascal(`Request${logic.name}`)} struct {`);
                                for (const el of logic.inputs) {
                                        stack.push(`    ${el.go.name} ${el.go.type} \`json:"${el.sql.name}"\``);
                                }
                                stack.push('}');
                                outputStack.push(this.FormatStack(stack).join('\n'));
                                stack = [];
                        }
                }
                if (table.logic[what]) {
                        for (const logic of table.logic[what]) {
                                if (logic.outputs.length === 0) continue;
                                stack.push(`type ${SnakeToPascal(`Response${logic.name}`)} struct {`);
                                for (const el of logic.outputs) {
                                        stack.push(`    ${el.go.name} ${el.go.type} \`json:"${el.sql.name}"\``);
                                }
                                stack.push('}');
                                outputStack.push(this.FormatStack(stack).join('\n'));
                                stack = [];
                        }
                }
                return outputStack;
        }

        Run() {
                let goTypes = this.GenerateGoTypes();
                this.output = goTypes;
                return this;
        }
}
