import { alignKeyword, alignKeywords, SnakeToPascal } from '../../core/formatting';
import { CodeGenerator, Endpoint, EndpointParam, HttpMethod, SQL_TO_GO_TYPE } from '../../core/structure';
import { GoRouter } from './go_router';

export class GoPkgModel extends CodeGenerator {
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
                                if (!table.endpoints) continue;

                                importsParts = importsParts.concat(GoRouter.GenerateImportsFormStruct(table.is));

                                stack.push(`type ${SnakeToPascal(tableName)} struct {`);
                                for (const attr of table.endpoints.read.single.http.bodyOut) {
                                        stack.push(`    ${attr.go.var.propertyName} ${attr.go.var.propertyGoType} \`json:"${attr.sql.name}"\``);
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
                                
import "myapp/pkg/validation"                                
                                `;
                                outputStack.unshift(pkg);

                                let fileContent = outputStack.join('\n').trim();

                                let InsertChangeset = GoPkgModel.BuildVarChangesets(table.endpoints.create.single, table.is);
                                let UpdateChangeset = GoPkgModel.BuildVarChangesets(table.endpoints.update.single, table.is);
                                let DeleteChangeset = GoPkgModel.BuildVarChangesets(table.endpoints.delete.single, table.is);

                                let finalAnswer = [fileContent, InsertChangeset, UpdateChangeset, DeleteChangeset];
                                let finalAnswerStr = finalAnswer.join('\n\n');

                                this.output[`/pkg/models/${table.label}.go`] = finalAnswerStr;

                                this.output[`/pkg/services/${table.label}.go`] = `package services\n\n// add business logic here`;
                        }
                }

                return this;
        }

        private static BuildVarChangesets(endpoint: Endpoint, value: EndpointParam[]): string {
                let items = [...value];
                let firstLetter = endpoint.go.real.name[0];

                let phrases = items
                        .filter((e) => !e.systemField)
                        .map((e) => {
                                if (!e.validation.range) {
                                        return `// ${e.go.var.propertyName} has no validation`;
                                }

                                // if deleting we do not really use atm
                                if (endpoint.method === HttpMethod.DELETE) {
                                        return `// ${e.go.var.propertyName} validation optional on delete`;
                                }

                                // if updating we only care about the fields we will change, the non readonly ones
                                if (endpoint.method === HttpMethod.PUT && e.readOnly) {
                                        return `// ${e.go.var.propertyName} is 'readonly', not changing on update or needing validation`;
                                }

                                let str = '';
                                let errTitle = e.go.var.propertyAsVariable;
                                let range = e.validation.range;
                                // let returnVal = returnValue ? `${endpoint.go.primaryKey.go.stuff.emptyValue}, err` : 'err';
                                if (range) {
                                        if (e.go.var.propertyGoType === 'string') {
                                                str = `    if err := validation.ValidateString(${firstLetter}.${e.go.var.propertyName}, ${range.min}, ${range.max}); err != nil {
        changeset.Errors["${errTitle}"] = err.Error()
    }`;
                                        } else if (e.go.var.propertyGoType === 'float64') {
                                                str = `    if err :=  validation.ValidateFloat64(${firstLetter}.${e.go.var.propertyName}, ${range.min}, ${range.max}); err != nil {
        changeset.Errors["${errTitle}"] = err.Error()
    }`;
                                        } else {
                                                str = `    if err :=  validation.ValidateNumber(${firstLetter}.${e.go.var.propertyName}, ${range.min}, ${range.max}); err != nil {
        changeset.Errors["${errTitle}"] = err.Error()
    }`;
                                        }
                                }
                                // console.log('e.validation.required :>> ', e.go.var.propertyName, e.validation.required);
                                if (!e.validation.required) {
                                        // str = GoCommentItOut(str, 'commented out because the field is not required');
                                        str = `
    // ${e.go.var.propertyName} is not required (is nullable) so we only validate if it was given
    if ${firstLetter}.${e.go.var.propertyName} != ${e.go.stuff.emptyValue} {
    ${str}
    }`;
                                }

                                return str;
                        });

                let validationStrs = phrases.join('\n    ');

                let answer = `func (${firstLetter} *${endpoint.go.real.type}) ${endpoint.changeSetName}() validation.Changeset[${endpoint.go.real.type}] {
    changeset := validation.NewChangeset(${firstLetter})

${validationStrs}
    return changeset
}
`;

                return answer;
        }
}
