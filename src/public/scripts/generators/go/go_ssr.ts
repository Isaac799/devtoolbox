import { alignKeyword, alignKeywords, SnakeToPascal, SnakeToTitle } from '../../core/formatting';
import { CodeGenerator, FileOutputs, SQL_TO_GO_TYPE, SqlTable } from '../../core/structure';

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
                                if (!table.endpoints) continue;
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
                if (!table.endpoints) {
                        return {};
                }

                let htmlFiles: FileOutputs = {};

                let htmlNew = GoSSR.GenerateHtmlNew(table);
                let htmlEdit = GoSSR.GenerateHtmlEdit(table);
                let htmlIndex = GoSSR.GenerateHtmlIndex(table);
                let htmlShow = GoSSR.GenerateHtmlShow(table);

                // the endpoint not really matter here
                let fp = table.endpoints.read.single.filePath;

                htmlFiles[fp('new')] = htmlNew;
                htmlFiles[fp('edit')] = htmlEdit;
                htmlFiles[fp('index')] = htmlIndex;
                htmlFiles[fp('show')] = htmlShow;

                return htmlFiles;
        }

        private static GenerateHtmlNew(table: SqlTable): string {
                let title = SnakeToTitle(table.label);
                let show = Object.values(table.attributes);

                let attrInputsStr = show
                        .filter((e) => !e.isPrimaryKey())
                        .map((e) => SQL_TO_GO_TYPE[e.sqlType].htmlInputFunction(e))
                        .join('\n        ');

                let urlHtml = table.endpoints!.read.single.url.indexPage;

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
            <a href="${urlHtml}">${title}</a>
        </li>
        <li class="is-active">
            <a href="${urlHtml}/new" aria-current="page">New</a>
        </li>
    </ul>
</nav>

<div class="container">
    <h1 class="title">${title} Form</h1>
    <form action="${urlHtml}" method="POST">
        
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
                let inputPUT = `<input type="hidden" name="_method" value="PUT" />`;
                let inputDELETE = `<input type="hidden" name="_method" value="DELETE" />`;
                // let inputPUT = ``;
                // let inputDELETE = ``;

                let title = SnakeToTitle(table.label);
                let show = Object.values(table.attributes);

                let attrInputsStr = show
                        .map((e) => {
                                if (e.isPrimaryKey() || e.readOnly) {
                                        return ` <p><strong>${SnakeToTitle(e.value)}:</strong> {{.Data.${SnakeToPascal(e.value)}}}</p>`;
                                } else {
                                        return SQL_TO_GO_TYPE[e.sqlType].htmlInputWithValueFunction(e, SnakeToPascal(e.value));
                                }
                        })
                        .join('\n        ');

                let urlHtml = table.endpoints!.read.single.url.indexPage;
                let pkProp = table.endpoints?.read.single.go.primaryKey.go.var.propertyName;

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
            <a href="${urlHtml}">${title}</a>
        </li>
        <li>
            <a href="${urlHtml}/{{ .Data.${pkProp} }}"> {{ .Data.${pkProp} }}</a>
        </li>
        <li class="is-active">
            <a href="${urlHtml}/{{ .Data.${pkProp} }}/edit" aria-current="page">Edit</a>
        </li>
    </ul>
</nav>

<div class="container">
    <h1 class="title">Edit ${title}</h1>
    <form action="${urlHtml}/{{ .Data.${pkProp} }}" method="POST">
        ${inputPUT}
       
        ${attrInputsStr}

        <div class="buttons">
            <button class="button is-primary" type="submit">Save Changes</button>
        </div>
    </form>

    <div class="pt-3">
        <button
            type="button"
            class="button is-danger"
            onclick="openConfirmDeleteModal()"
        >
            Delete ${title}
        </button>
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
                        action="${urlHtml}/{{ .Data.${pkProp} }}"
                        method="POST"
                        style="display: inline"
                    >
                        ${inputDELETE}
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

                let show = table.endpoints!.read.single.http.bodyOut;
                let urlHtml = table.endpoints!.read.single.url.indexPage;
                let pkProp = table.endpoints!.read.single.go.primaryKey.go.var.propertyName;

                let attrsTableHeaderStr = show.map((e) => ` <th>${SnakeToTitle(e.sql.name)}</th>`).join('\n            ');
                let attrsTableBodyStr = show
                        .map((e) => {
                                // <td>{{if .IsActive}}Yes{{else}}No{{end}}</td>

                                if (e.go.var.propertyName === pkProp) {
                                        return ` <td><a href="${urlHtml}/{{.${pkProp}}}"> {{.${e.go.var.propertyName}}} </a></td>`;
                                } else {
                                        return ` <td>{{.${e.go.var.propertyName}}}</td>`;
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
            <a href="${urlHtml}" aria-current="page">${title}</a>
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
            <a class="button is-info" href="${urlHtml}/new">New ${title}</a>
        </div>
    </div>
</div>

{{ end }}
`;

                return str;
        }
        private static GenerateHtmlShow(table: SqlTable): string {
                let title = SnakeToTitle(table.label);

                let show = table.endpoints!.read.single.http.bodyOut;
                let urlHtml = table.endpoints!.read.single.url.indexPage;
                let pkProp = table.endpoints?.read.single.go.primaryKey.go.var.propertyName;

                let attrsStr = show.map((e) => ` <p><strong>${SnakeToTitle(e.sql.name)}:</strong> {{.Data.${e.go.var.propertyName}}}</p>`).join('\n        ');

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
            <a href="${urlHtml}">${title}</a>
        </li>
        <li class="is-active">
            <a href="${urlHtml}/{{ .Data.${pkProp} }}" aria-current="page">
                {{ .Data.${pkProp} }}
            </a>
        </li>
    </ul>
</nav>

<div class="container">
    <h1 class="title">${title} Details</h1>
    <div class="box">
        ${attrsStr}
    </div>
    <div class="field">
        <div class="control">
            <a class="button is-info" href="${urlHtml}/{{ .Data.${pkProp} }}/edit">
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
