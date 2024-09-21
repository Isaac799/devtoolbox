import { SnakeToPascal, SnakeToTitle } from '../core/formatting';
import { CodeGenerator, SqlTable, TableLogic, Types } from '../core/structure';

export class TsTypesCodeGenerator extends CodeGenerator {
        SQL_TO_TS_TYPE = {
                [Types.BIT]: 'boolean',
                [Types.DATE]: 'Date',
                [Types.CHAR]: 'string',
                [Types.TIME]: 'Date',
                [Types.TIMESTAMP]: 'Date',
                [Types.SERIAL]: 'number',
                [Types.DECIMAL]: 'number',
                [Types.FLOAT]: 'number',
                [Types.REAL]: 'number',
                [Types.INT]: 'number',
                [Types.BOOLEAN]: 'boolean',
                [Types.xs]: 'string',
                [Types.s]: 'string',
                [Types.m]: 'string',
                [Types.l]: 'string',
                [Types.xl]: 'string',
                [Types.xxl]: 'string',
        };

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

                                let logics: Array<keyof TableLogic> = ['create', 'read', 'update', 'delete'];

                                for (const logic of logics) {
                                        let stuff = this.CreateLogic(table, logic);
                                        outputStack = outputStack.concat(stuff);
                                }

                                stack.push(`export type ${SnakeToTitle(tableName)} = {`);
                                for (const attrName in table.attributes) {
                                        if (!Object.prototype.hasOwnProperty.call(table.attributes, attrName)) {
                                                continue;
                                        }
                                        const attr = table.attributes[attrName];
                                        stack.push(`    ${attrName}: ${this.SQL_TO_TS_TYPE[attr.sqlType]};`);
                                }
                                stack.push('}');

                                outputStack.push(stack.join(`\n`));
                                stack = [];
                        }
                }

                return outputStack.join('\n').trim();
        }

        private CreateLogic(table: SqlTable, what: keyof TableLogic) {
                let stack: string[] = [];
                let outputStack: string[] = [];

                if (table.logic[what]) {
                        for (const logic of table.logic[what]) {
                                if (logic.inputs.length === 0) continue;
                                stack.push(`export type ${SnakeToPascal(`request_${logic.name}`)} = {`);
                                for (const el of logic.inputs) {
                                        stack.push(`    ${el.name}: ${this.SQL_TO_TS_TYPE[el.type]};`);
                                }
                                stack.push('}');
                                outputStack.push(stack.join('\n'));
                                stack = [];
                        }
                }
                if (table.logic[what]) {
                        for (const logic of table.logic[what]) {
                                if (logic.outputs.length === 0) continue;
                                stack.push(`export type ${SnakeToPascal(`response_${logic.name}`)} = {`);
                                for (const el of logic.outputs) {
                                        stack.push(`    ${el.name}: ${this.SQL_TO_TS_TYPE[el.type]};`);
                                }
                                stack.push('}');
                                outputStack.push(stack.join('\n'));
                                stack = [];
                        }
                }
                return outputStack;
        }

        Run() {
                let tsTypes = this.GenerateTsTypes();
                this.output = tsTypes;
                return this;
        }
}
