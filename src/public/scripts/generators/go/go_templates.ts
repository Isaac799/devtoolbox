import { SnakeToTitle } from '../../core/formatting';
import { CodeGenerator } from '../../core/structure';

export class GoTemplates extends CodeGenerator {
        Run() {
                this.output = {
                        '/web/templates/base.html': GoTemplates.baseHtml,
                        '/web/templates/footer.html': GoTemplates.footerHtml,
                        '/web/templates/navbar.html': this.GenerateNavigationBar(),
                        '/web/templates/show.home.html': GoTemplates.homeHtml,
                        '/web/static/bulma.js': GoTemplates.bulmaJs,
                };
                return this;
        }

        GenerateNavigationBar(): string {
                let linksToAppIndexes: {
                        name: string;
                        path: string;
                }[] = [];
                let schemas = this.input;
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
                                if (!table.endpoints?.read.single) {
                                        continue;
                                }
                                linksToAppIndexes.push({
                                        name: table.label,
                                        path: table.endpoints.read.many.url.indexPage,
                                });
                        }
                }

                let htmlLinks = linksToAppIndexes.map((e) => `            <a class="navbar-item" href="${e.path}">${SnakeToTitle(e.name)}</a>`);

                let str = `{{ define "navbar" }}
<nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
        <a class="navbar-item" href="/">Home</a>
        <button
            class="navbar-burger"
            aria-label="menu"
            aria-expanded="false"
            data-target="navbar"
        >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
        </button>
    </div>

    <div id="navbar" class="navbar-menu">
        <div class="navbar-end">
${htmlLinks}
        </div>
    </div>
</nav>
{{ end }}
`;
                return str;
        }

        private static readonly homeHtml = `{{ define "content" }}

<section class="hero is-info">
    <div class="hero-body">
        <div class="container">
            <h1 class="title">About Us</h1>
            <h2 class="subtitle">Learn more about what we do!</h2>
        </div>
    </div>
</section>

{{ template "navbar" . }}

<section class="section">
    <div class="container">
        <h2 class="title">What We Do</h2>
        <p class="content">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
            vitae eros eget tellus tristique bibendum. Curabitur sodales ligula
            in libero. Sed dignissim lacinia nunc. Phasellus magna. In hac
            habitasse platea dictumst.
        </p>

        <h2 class="title">Our Core Principles</h2>
        <p class="content">
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
            nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur.
        </p>

        <h2 class="title">Join Us</h2>
        <p class="content">
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
            officia deserunt mollit anim id est laborum. Nam libero tempore, cum
            soluta nobis est eligendi optio cumque nihil impedit quo minus id
            quod maxime placeat facere possimus.
        </p>

        <h2 class="title">Our Vision</h2>
        <p class="content">
            Nulla facilisi. Integer lacinia sollicitudin massa. Cras in nibh id
            lacus lacinia semper. Morbi vel lectus vitae libero dictum gravida.
            Sed consequat, leo eget bibendum sodales, augue velit cursus nunc,
            quis gravida magna mi a libero.
        </p>

        <h2 class="title">Get In Touch</h2>
        <p class="content">
            Fusce tincidunt, est in aliquam efficitur, leo arcu varius odio, eu
            tincidunt erat sapien sit amet urna. Vivamus sit amet libero sed
            eros venenatis aliquam ac vitae magna. Contact us to learn more
            about how you can get involved with our initiatives.
        </p>
    </div>
</section>

{{ template "footer" . }}{{ end }}
`;
        private static readonly footerHtml = `{{ define "footer" }}
<footer class="footer">
    <div class="content has-text-centered">
        <p>{{ .Year }} My Site</p>
    </div>
</footer>
{{ end }}
`;
        private static readonly baseHtml = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{{ .Title }}</title>
        <!--
        It is recommended to download the and use the stylesheet in your project '/assets/css/bulma.min.css'
        bulma@1.0.2/css/bulma.min.css

        <link rel="stylesheet" href="/assets/css/bulma.min.css" />
          -->
        <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css"
        />
        <link rel="stylesheet" href="/assets/style.css" />
        <script src="/assets/bulma.js"></script>
        <link rel="icon" href="/assets/favicon.ico" type="image/x-icon" />
    </head>
    <body>
        {{ block "content" . }}{{ end }}
    </body>
</html>
`;

        private static readonly bulmaJs = `document.addEventListener("DOMContentLoaded", () => {
    const burger = document.querySelector(".navbar-burger");
    const menu = document.querySelector("#navbar");

    if (burger) {
        burger.addEventListener("click", () => {
            burger.classList.toggle("is-active");
            menu.classList.toggle("is-active");
        });
    }
});

function openConfirmDeleteModal() {
    document.getElementById("confirmModal").classList.add("is-active");
}

function closeConfirmDeleteModal() {
    document.getElementById("confirmModal").classList.remove("is-active");
}

document.getElementById("confirmDelete").onclick = function () {
    document.getElementById("deleteForm").submit();
};
`;
}
