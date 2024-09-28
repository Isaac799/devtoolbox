import { SnakeToTitle } from '../core/formatting';
import { CodeGenerator, CodeLogic } from '../core/structure';

export class HtmlCodeGenerator extends CodeGenerator {
        GenerateHtmlBody(): string {
                let schemas = this.input;
                let sections: string[] = [];

                // ADD INPUTS

                sections.push(`<body class="flex-column">`);

                function ConvertNameToEndpoint(value: string) {
                        return value.replace(/read_|create_|update_|delete_/g, '').replace(/_/g, '-');
                }

                /**
                 *
                 * @param {CodeLogic} logic
                 * @returns
                 */
                function CreateInputFields(logic: CodeLogic) {
                        let placeholders: string[] = [];
                        for (let i = 0; i < logic.inputs.length; i++) {
                                const element = logic.inputs[i];
                                const id = `${logic.name}_${element.sql.name}`;
                                placeholders.push(`            <div class="flex-column">
                    <label for="${id}">${element.html.name}</label>
                    <input type="${element.html.type}" name="${element.html.name}" id="${id}" />
            </div>`);
                        }
                        let placeholderStr = placeholders.join('\n');
                        return placeholderStr;
                }

                for (const schemaName in schemas) {
                        if (!Object.prototype.hasOwnProperty.call(schemas, schemaName)) {
                                continue;
                        }
                        const schema = schemas[schemaName];

                        let schemaSection: string[] = [];

                        const htmlSchemaSection = `<h2>${SnakeToTitle(schema.name)}</h2>`;
                        schemaSection.push(htmlSchemaSection);

                        for (const tableName in schema.tables) {
                                if (!Object.prototype.hasOwnProperty.call(schema.tables, tableName)) {
                                        continue;
                                }
                                const table = schema.tables[tableName];
                                let tableSection: string[] = [];

                                if (table.logic.create === null && table.logic.read === null && table.logic.update === null && table.logic.delete === null) {
                                        continue;
                                }

                                const htmlEntitySection = `    <h3>${SnakeToTitle(table.label)}</h3>`;
                                tableSection.push(htmlEntitySection);

                                const SUBMIT_BUTTON = `            <input type="submit" value="Submit" />`;
                                const OPTIONS_SUBMIT_BUTTON = `            <input type="submit" value="Read Options" />`;

                                if (table.logic.create !== null) {
                                        const htmlSubSection = `    <div class="flex-row"><h4>Create</h4></div>`;
                                        tableSection.push(htmlSubSection);
                                        for (let m = 0; m < table.logic.create.length; m++) {
                                                const create = table.logic.create[m];

                                                let endpoint = ConvertNameToEndpoint(create.name);
                                                let params = CreateInputFields(create);
                                                // let where = 'body';
                                                let str = params;
                                                let form = `    <form submit="./${endpoint}" method="post">
        <div class="flex-row">                                                
${str}
${SUBMIT_BUTTON}
        </div>     
    </form>`;
                                                tableSection.push(form);
                                        }
                                }
                                if (table.logic.read !== null) {
                                        const htmlSubSection = `    <div class="flex-row"><h4>Read</h4></div>`;
                                        tableSection.push(htmlSubSection);
                                        for (let m = 0; m < table.logic.read.length; m++) {
                                                const read = table.logic.read[m];

                                                let endpoint = ConvertNameToEndpoint(read.name);

                                                if (read.is_options) {
                                                        let form = `    <form submit="./${endpoint}" method="get">
        <div class="flex-row">                                                
${OPTIONS_SUBMIT_BUTTON}
        </div>     
    </form>`;
                                                        tableSection.push(form);
                                                        continue;
                                                }

                                                let params = CreateInputFields(read);
                                                // let where = 'params';
                                                let str = params;
                                                let form = `    <form submit="./${endpoint}" method="get">
        <div class="flex-row">                                                
${str}
${SUBMIT_BUTTON}
        </div>     
    </form>`;
                                                tableSection.push(form);
                                        }
                                }
                                if (table.logic.update !== null) {
                                        const htmlSubSection = `    <div class="flex-row"><h4>Update</h4></div>`;
                                        tableSection.push(htmlSubSection);
                                        for (let m = 0; m < table.logic.update.length; m++) {
                                                const update = table.logic.update[m];

                                                let endpoint = ConvertNameToEndpoint(update.name);

                                                let params = CreateInputFields(update);
                                                // let where = 'body';
                                                let str = params;

                                                let form = `    <form submit="./${endpoint}" method="put">
        <div class="flex-row">                                                
${str}
${SUBMIT_BUTTON}
        </div>     
    </form>`;
                                                tableSection.push(form);
                                        }
                                }
                                if (table.logic.delete !== null) {
                                        const htmlSubSection = `    <div class="flex-row"><h4>Delete</h4></div>`;
                                        tableSection.push(htmlSubSection);
                                        for (let m = 0; m < table.logic.delete.length; m++) {
                                                const del = table.logic.delete[m];

                                                let endpoint = ConvertNameToEndpoint(del.name);
                                                let params = CreateInputFields(del);
                                                // let where = 'body';
                                                let str = params;
                                                let form = `    <form submit="./${endpoint}" method="delete">
        <div class="flex-row">                                                
${str}
${SUBMIT_BUTTON}
        </div>                                                
    </form>`;
                                                tableSection.push(form);
                                        }
                                }

                                schemaSection.push(tableSection.join('\n\n'));
                        }

                        sections.push(schemaSection.join('\n'));
                }

                let footerInfo = `
</body>`;
                sections.push(footerInfo);
                return sections.join('\n');
        }
        GenerateJavaScript() {
                let lines: string[] = [];

                lines.push(`<script>
        function Main(_) {`);

                // ADD SCRIPTS

                lines.push(`
        }
        window.addEventListener("DOMContentLoaded", Main)
    </script>`);

                return lines.join('\n');
        }
        GenerateStyles() {
                const style = `body,
                pre,
                input,
                textarea,
                code,
                button {
                    font-size: 16px;
                    font-family: Verdana, Geneva, Tahoma, sans-serif;
                }
                
                pre,
                code,
                textarea {
                    font-family: "Courier New", Courier, monospace;
                }
                
                .flex-column {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    justify-content: flex-start;
                    align-items: flex-start;
                }
                
                .flex-row {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: 1rem;
                    justify-content: flex-start;
                    align-items: center;
                }
                form {
                    padding: 0.35rem 0.5rem 0.35rem 0.5rem;
                    border: 1px solid black;
                    border-radius: 6px;
                }`;
                return style;
        }

        Run() {
                let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        ${this.GenerateStyles()}
    </style>
    ${this.GenerateJavaScript()}
</head>
${this.GenerateHtmlBody()}
</html>
        `;
                this.output = {
                        'index.html': html,
                };
                return this;
        }
}
