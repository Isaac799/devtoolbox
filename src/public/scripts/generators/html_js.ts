import { SnakeToTitle } from '../core/formatting';
import { CodeGenerator, Endpoint } from '../core/structure';

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
                 * @param {Endpoint} endpoint
                 * @returns
                 */
                function CreateInputFields(endpoint: Endpoint) {
                        let placeholders: string[] = [];
                        for (let i = 0; i < endpoint.http.bodyIn.length; i++) {
                                const element = endpoint.http.bodyIn[i];
                                const id = `${endpoint.sql.name}_${element.sql.name}`;
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

                                if (
                                        table.entityEndpoints.create === null &&
                                        table.entityEndpoints.read === null &&
                                        table.entityEndpoints.update === null &&
                                        table.entityEndpoints.delete === null
                                ) {
                                        continue;
                                }

                                const htmlEntitySection = `    <h3>${SnakeToTitle(table.label)}</h3>`;
                                tableSection.push(htmlEntitySection);

                                const SUBMIT_BUTTON = `            <input type="submit" value="Submit" />`;
                                const OPTIONS_SUBMIT_BUTTON = `            <input type="submit" value="Read Options" />`;

                                if (table.entityEndpoints.create !== null) {
                                        const htmlSubSection = `    <div class="flex-row"><h4>Create</h4></div>`;
                                        tableSection.push(htmlSubSection);
                                        for (let m = 0; m < table.entityEndpoints.create.length; m++) {
                                                const create = table.entityEndpoints.create[m];

                                                let endpoint = ConvertNameToEndpoint(create.sql.name);
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
                                if (table.entityEndpoints.read !== null) {
                                        const htmlSubSection = `    <div class="flex-row"><h4>Read</h4></div>`;
                                        tableSection.push(htmlSubSection);
                                        for (let m = 0; m < table.entityEndpoints.read.length; m++) {
                                                const read = table.entityEndpoints.read[m];

                                                let endpoint = ConvertNameToEndpoint(read.sql.name);

                                                if (read.isOptions) {
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
                                if (table.entityEndpoints.update !== null) {
                                        const htmlSubSection = `    <div class="flex-row"><h4>Update</h4></div>`;
                                        tableSection.push(htmlSubSection);
                                        for (let m = 0; m < table.entityEndpoints.update.length; m++) {
                                                const update = table.entityEndpoints.update[m];

                                                let endpoint = ConvertNameToEndpoint(update.sql.name);

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
                                if (table.entityEndpoints.delete !== null) {
                                        const htmlSubSection = `    <div class="flex-row"><h4>Delete</h4></div>`;
                                        tableSection.push(htmlSubSection);
                                        for (let m = 0; m < table.entityEndpoints.delete.length; m++) {
                                                const del = table.entityEndpoints.delete[m];

                                                let endpoint = ConvertNameToEndpoint(del.sql.name);
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
