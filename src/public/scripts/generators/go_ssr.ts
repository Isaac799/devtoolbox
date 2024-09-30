import { alignKeyword, alignKeywords, SnakeToPascal, SnakeToTitle } from '../core/formatting';
import { CodeGenerator, FileOutputs, SQL_TO_GO_TYPE, SqlTable } from '../core/structure';

export class GoSSR extends CodeGenerator {
        FormatStack(stack: string[]) {
                let types = alignKeywords(
                        stack,
                        Object.values(SQL_TO_GO_TYPE).map((e) => e.goType)
                );
                let jsons = alignKeyword(types, '`json:');
                return jsons;
        }

        GenerateFileOutputs(): FileOutputs {
                let schemas = this.input;
                let answer: FileOutputs = {};
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
                                let files = this.GenerateHtmlFiles(table);
                                answer = {
                                        ...answer,
                                        ...files,
                                };
                        }
                }
                return answer;
        }

        GenerateHtmlFiles(table: SqlTable): FileOutputs {
                if (!table.endpoints.goShow) {
                        console.error('error: missing show');
                        return {};
                }

                let htmlFiles: FileOutputs = {};

                let htmlNew = GoSSR.GenerateHtmlNew(table);
                let htmlEdit = GoSSR.GenerateHtmlEdit(table);
                let htmlIndex = GoSSR.GenerateHtmlIndex(table);
                let htmlShow = GoSSR.GenerateHtmlShow(table);

                htmlFiles[table.endpoints.goShow.filePath('new')] = htmlNew;
                htmlFiles[table.endpoints.goShow.filePath('edit')] = htmlEdit;
                htmlFiles[table.endpoints.goShow.filePath('index')] = htmlIndex;
                htmlFiles[table.endpoints.goShow.filePath('show')] = htmlShow;

                return htmlFiles;
        }

        private static GenerateHtmlNew(table: SqlTable): string {
                let title = SnakeToTitle(table.label);
                let show = table.endpoints.goShow;
                if (!show) {
                        return 'error: missing show';
                }

                let attrInputsStr = show.sqlAttributes.map((e) => SQL_TO_GO_TYPE[e.sqlType].htmlInputFunction(e)).join('\n        ');

                let str = `{{ define "content" }}

<section class="hero is-info">
    <div class="hero-body">
        <div class="container">
            <h1 class="title">New ${title}</h1>
        </div>
    </div>
</section>

{{ template "navbar" . }}
 
<nav class="breadcrumb is-centered" aria-label="breadcrumbs">
    <ul>
        <li>
            <a href="${show.url}">${title}</a>
        </li>
        <li class="is-active">
            <a href="${show.url}/new" aria-current="page">New</a>
        </li>
    </ul>
</nav>

{{ template "navbar" . }}

<div class="container">
    <h1 class="title">${title} Form</h1>
    <form action="${show.url}" method="POST">
        
        ${attrInputsStr}

        <div class="field">
            <div class="control">
                <button class="button is-primary" type="submit">Submit</button>
            </div>
        </div>
    </form>
</div>
{{ end }}
`;

                return str;
        }
        private static GenerateHtmlEdit(table: SqlTable): string {
                let title = SnakeToTitle(table.label);
                let show = table.endpoints.goShow;
                if (!show) {
                        return 'error: missing show';
                }

                let attrInputsStr = show.sqlAttributes
                        .map((e) => SQL_TO_GO_TYPE[e.sqlType].htmlInputFunction(e, `{{ .Data.${SnakeToPascal(e.value)} }}`))
                        .join('\n        ');

                let str = `{{ define "content" }}

<section class="hero is-info">
    <div class="hero-body">
        <div class="container">
            <h1 class="title">Edit ${title}</h1>
        </div>
    </div>
</section>

{{ template "navbar" . }}

<nav class="breadcrumb is-centered" aria-label="breadcrumbs">
    <ul>
        <li>
            <a href="${show.url}">${title}</a>
        </li>
        <li>
            <a href="${show.url}/{{ .Data.${show.primaryKeyName} }}">${show.primaryKeyName}</a>
        </li>
        <li class="is-active">
            <a href="${show.url}/{{ .Data.${show.primaryKeyName} }}/edit" aria-current="page">Edit</a>
        </li>
    </ul>
</nav>

<div class="container">
    <h1 class="title">Edit ${title}</h1>
    <form action="${show.url}/{{ .Data.${show.primaryKeyName} }}" method="POST">
       
        ${attrInputsStr}

        <div class="buttons">
            <button class="button is-primary" type="submit">Save Changes</button>
        </div>
    </form>

    <div class="pt-3">
        <form
            id="deleteForm"
            action="${show.url}/{{ .Data.${show.primaryKeyName} }}"
            method="POST"
            style="display: inline"
        >
            <input type="hidden" name="_method" value="DELETE" />
            <button
                type="button"
                class="button is-danger"
                onclick="openConfirmDeleteModal()"
            >
                Delete ${title}
            </button>
        </form>
    </div>

    <div class="modal" id="confirmModal">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Are you sure?</p>
                <button
                    class="delete"
                    aria-label="close"
                    onclick="closeConfirmDeleteModal()"
                ></button>
            </header>
            <section class="modal-card-body">
                <p>
                    Are you sure you want to delete this ${title}? This action
                    cannot be undone.
                </p>
            </section>
            <footer class="modal-card-foot">
                <div class="buttons">
                    <button class="button" onclick="closeConfirmDeleteModal()">
                        Cancel
                    </button>
                    <form
                        action="${show.url}/{{ .Data.${show.primaryKeyName} }}"
                        method="POST"
                        style="display: inline"
                    >
                        <input type="hidden" name="_method" value="DELETE" />
                        <button type="submit" class="button is-danger">
                            Delete ${title}
                        </button>
                    </form>
                </div>
            </footer>
        </div>
    </div>
</div>

{{ end }}
`;
                return str;
        }
        private static GenerateHtmlIndex(table: SqlTable): string {
                let title = SnakeToTitle(table.label);
                let show = table.endpoints.goShow;
                if (!show) {
                        return 'error: missing show';
                }

                let attrsTableHeaderStr = show.propertyNames.map((e) => ` <th>${SnakeToTitle(e)}</th>`).join('\n            ');
                let attrsTableBodyStr = show.propertyNames
                        .map((e) => {
                                // <td>{{if .IsActive}}Yes{{else}}No{{end}}</td>

                                if (e === show.primaryKeyName) {
                                        return ` <td><a href="${show.url}/{{.${show.primaryKeyName}}}"> {{.${e}}} </a></td>`;
                                } else {
                                        return ` <td>{{.${e}}}</td>`;
                                }
                        })
                        .join('\n                ');
                attrsTableHeaderStr = `<tr>\n            ${attrsTableHeaderStr}\n        </tr>`;
                attrsTableBodyStr = `<tr>\n                ${attrsTableBodyStr}\n            </tr>`;
                let str = `{{ define "content" }}

<section class="hero is-info">
    <div class="hero-body">
        <div class="container">
            <h1 class="title">Index ${title}</h1>
        </div>
    </div>
</section>

{{ template "navbar" . }}

<nav class="breadcrumb is-centered" aria-label="breadcrumbs">
    <ul>
        <li class="is-active">
            <a href="${show.url}" aria-current="page">${title}</a>
        </li>
    </ul>
</nav>

<div class="container">
    <table class="table is-striped is-fullwidth">
        <thead>
        ${attrsTableHeaderStr}
        </thead>
        <tbody>
            {{range .Data }}
            ${attrsTableBodyStr}
            {{end}}
        </tbody>
    </table>

    <div class="field">
        <div class="control">
            <a class="button is-info" href="${show.url}/new">New ${title}</a>
        </div>
    </div>
</div>

{{ end }}
`;

                return str;
        }
        private static GenerateHtmlShow(table: SqlTable): string {
                let title = SnakeToTitle(table.label);
                let show = table.endpoints.goShow;
                if (!show) {
                        return 'error: missing show';
                }

                let attrsStr = show.propertyNames.map((e) => ` <p><strong>${SnakeToTitle(e)}:</strong> {{.Data.${e}}}</p>`).join('\n        ');

                let str = `{{ define "content" }}

<section class="hero is-info">
    <div class="hero-body">
        <div class="container">
            <h1 class="title">Show ${title}</h1>
        </div>
    </div>
</section>

{{ template "navbar" . }}

<nav class="breadcrumb is-centered" aria-label="breadcrumbs">
    <ul>
        <li>
            <a href="${show.url}">${title}</a>
        </li>
        <li class="is-active">
            <a href="${show.url}/{{ .Data.${show.primaryKeyName} }}" aria-current="page">
                {{ .Data.${show.primaryKeyName} }}
            </a>
        </li>
    </ul>
</nav>

<div class="container">
    <h1 class="title">${show.sqlTableName} Details</h1>
    <div class="box">
        ${attrsStr}
    </div>
    <div class="field">
        <div class="control">
            <a class="button is-info" href="${show.url}/{{ .Data.${show.primaryKeyName} }}/edit">
                Edit ${title}
            </a>
        </div>
    </div>
</div>

{{ end }}
`;

                return str;
        }

        Run() {
                let go = this.GenerateFileOutputs();
                this.output = {
                        ...go,
                };
                return this;
        }
}
