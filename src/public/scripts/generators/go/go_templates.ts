import { SnakeToTitle } from '../../core/formatting';
import { CodeGenerator } from '../../core/structure';

export class GoTemplates extends CodeGenerator {
        Run() {
                this.output = {
                        '/web/templates/base.html': GoTemplates.baseHtml,
                        '/web/templates/footer.html': GoTemplates.footerHtml,
                        '/web/templates/pagination.html': GoTemplates.paginationTemplate,
                        '/web/templates/navbar.html': this.GenerateNavigationBar(),
                        //
                        '/web/static/bulma.js': GoTemplates.bulmaJs,
                        '/web/static/smartForm.js': GoTemplates.smartForm,
                        //
                        '/pkg/services/render_html.go': GoTemplates.serviceRender,
                        '/pkg/services/get_pagination.go': GoTemplates.getPagination,
                        //
                        '/web/templates/page/home.html': GoTemplates.homeHtml,
                        '/web/templates/page/404.html': GoTemplates.notFoundHtml,
                        '/web/templates/page/500.html': GoTemplates.serverErrorHtml,
                        //
                        '/internal/handlers/page/home.go': GoTemplates.homeHandler,
                        '/internal/handlers/page/404.go': GoTemplates.notFoundHandler,
                        '/internal/handlers/page/500.go': GoTemplates.serverErrorHandler,
                        //
                        '/pkg/models/pagination.go': GoTemplates.paginationModel,
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

                let htmlLinks = linksToAppIndexes.map((e) => `        <a class="navbar-item" href="${e.path}">${SnakeToTitle(e.name)}</a>`);

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

<section class="hero is-primary">
    <div class="hero-body">
    <div class="container">
        <h1 class="title">Welcome to Our Community</h1>
        <h2 class="subtitle">Discover, Engage, and Grow Together!</h2>
    </div>
    </div>
</section>

{{ template "navbar" . }}

<section class="section">
    <div class="container">
    <h2 class="title">Our Mission</h2>
    <p class="content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel nisi at nisl pharetra auctor. 
        Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.
    </p>

    <h2 class="title">Upcoming Events</h2>
    <p class="content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque non turpis sit amet nisl gravida 
        laoreet ut a erat. Curabitur vel felis nec nisl tincidunt dignissim.
    </p>

    <h2 class="title">Success Stories</h2>
    <p class="content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sit amet turpis vitae massa 
        dignissim facilisis. Sed vel orci vitae lacus suscipit pretium.
    </p>

    <h2 class="title">Get Involved</h2>
    <p class="content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis non velit eget nisl tristique 
        facilisis in ut mi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere 
        cubilia curae.
    </p>

    <h2 class="title">Stay Connected</h2>
    <p class="content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin euismod, est non tristique 
        fermentum, arcu odio malesuada justo, vitae sagittis justo lacus in magna.
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
    <script src="/assets/smartForm.js"></script>
    <link rel="icon" href="/assets/favicon.ico" type="image/x-icon" />
    </head>
    <body>
    {{ block "content" . }}{{ end }}
    </body>
</html>
`;

        private static readonly smartForm = `document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    
    if (!form) {
    console.info("Form element not found.");
    return;
    }

    const inputs = form.querySelectorAll("input, textarea, select");
    const formUrl = window.location.pathname;

    const storageKey = (name) => \`\${formUrl}-\${name}\`;

    const saveToLocalStorage = (name, value) => {
    try {
        const data = { value, timestamp: Date.now() };
        localStorage.setItem(storageKey(name), JSON.stringify(data));
    } catch (error) {
        console.error(\`Error saving to localStorage: \${error.message}\`);
    }
    };

    const loadFromLocalStorage = (input) => {
    try {
        const savedData = localStorage.getItem(storageKey(input.name));
        if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (
            parsedData &&
            Date.now() - parsedData.timestamp < 48 * 60 * 60 * 1000
        ) {
            input.value = parsedData.value;
        }
        }
    } catch (error) {
        console.error(\`Error loading from localStorage for \${input.name}: \${error.message}\`);
    }
    };

    const clearLocalStorage = () => {
    inputs.forEach((input) => {
        try {
        localStorage.removeItem(storageKey(input.name));
        } catch (error) {
        console.error(\`Error clearing localStorage for \${input.name}: \${error.message}\`);
        }
    });
    };

    inputs.forEach((input) => {
    loadFromLocalStorage(input);
    input.addEventListener("input", () =>
        saveToLocalStorage(input.name, input.value)
    );
    });

    form.addEventListener("submit", (event) => {
    clearLocalStorage();
    console.log("Form submitted. Local storage cleared.");
    });

    const resetForm = () => {
    clearLocalStorage();
    form.reset();
    window.location.reload();
    };

    const resetButton = document.getElementById("reset-form");
    if (resetButton) {
    resetButton.addEventListener("click", (e) => {
        e.preventDefault();
        resetForm();
    });
    }
});

`;

        private static readonly bulmaJs = `
document.addEventListener("DOMContentLoaded", () => {
    const burger = document.querySelector(".navbar-burger");
    const menu = document.querySelector("#navbar");

    if (burger && menu) {
    burger.addEventListener("click", () => {
        burger.classList.toggle("is-active");
        menu.classList.toggle("is-active");
    });
    } else {
    console.error("Navbar burger or menu not found.");
    }

    const notificationDeletes = document.querySelectorAll('.notification .delete');

    if (notificationDeletes.length > 0) {
    notificationDeletes.forEach(($delete) => {
        const $notification = $delete.parentNode;

        $delete.addEventListener('click', () => {
        if ($notification && $notification.parentNode) {
            $notification.parentNode.removeChild($notification);
        } else {
            console.error("Notification or parent node not found.");
        }
        });
    });
    }

});

function openConfirmDeleteModal() {
    const modal = document.getElementById("confirmModal");
    if (modal) {
    modal.classList.add("is-active");
    const confirmDeleteButton = document.getElementById("confirmDelete");
    if (confirmDeleteButton) {
        confirmDeleteButton.onclick = function () {
        const deleteForm = document.getElementById("deleteForm");
        if (deleteForm) {
            deleteForm.submit();
        } else {
            console.error("Delete form not found.");
        }
        };
    } else {
        console.error("Confirm delete button not found.");
    }
    } else {
    console.error("Confirm modal not found.");
    }
}

function closeConfirmDeleteModal() {
    const modal = document.getElementById("confirmModal");
    if (modal) {
    modal.classList.remove("is-active");
    } else {
    console.error("Confirm modal not found.");
    }
}
`;

        private static readonly notFoundHtml = `{{ define "content" }}

<section class="hero is-warning">
    <div class="hero-body">
    <div class="container">
        <h1 class="title">404 - Page Not Found</h1>
        <h2 class="subtitle">Oops! We couldn't find that page.</h2>
    </div>
    </div>
</section>

{{ template "navbar" . }}

<section class="section">
    <div class="container">
    <h2 class="title">What Happened?</h2>
    <p class="content">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
    </p>

    <h2 class="title">Try These Options</h2>
    <ul>
        <li><a href="/">Return to the homepage</a></li>
    </ul>
    </div>
</section>

{{ template "footer" . }}{{ end }}
`;

        private static readonly serverErrorHtml = `{{ define "content" }}

<section class="hero is-danger">
    <div class="hero-body">
    <div class="container">
        <h1 class="title">500 - Internal Server Error</h1>
        <h2 class="subtitle">Sorry! Something went wrong on our end.</h2>
    </div>
    </div>
</section>

{{ template "navbar" . }}

<section class="section">
    <div class="container">
    <h2 class="title">We're Working on It</h2>
    <p class="content">
        Our team has been notified and is working to resolve the issue. We apologize for the inconvenience.
    </p>
    
    <h2 class="title">Return to Safety</h2>
    <ul>
        <li><a href="/">Go back to the homepage</a></li>
    </ul>
    </div>
</section>

{{ template "footer" . }}{{ end }}
`;
        private static readonly serviceRender = `package services

import (
    "log"
    "myapp/pkg/validation"
    "net/http"
    "text/template"
    "time"
)

func RenderTemplate[T any](w http.ResponseWriter, title, templateName string, data T) {
    templateData := struct {
        Title string
        Year  int
        Data  interface{}
    }{
        Title: title,
        Year:  time.Now().Year(),
        Data:  data,
    }

    pageTemplate, err := template.ParseFiles(
        "../../web/templates/base.html",
        "../../"+templateName,
        "../../web/templates/navbar.html",
		"../../web/templates/pagination.html",
        "../../web/templates/footer.html",
    )

    if err != nil {
        log.Println("Error parsing templates:", err)
        http.Error(w, "Internal server error", http.StatusInternalServerError)
        return
    }

    err = pageTemplate.ExecuteTemplate(w, "base.html", templateData)
    if err != nil {
        log.Println("Error executing template:", err)
        http.Error(w, "Internal server error", http.StatusInternalServerError)
    }
}

func RenderChangesetPage[T any](w http.ResponseWriter, _ *http.Request, title, templateName string, changeset *validation.Changeset[T]) {
    RenderTemplate(w, title, templateName, changeset)
}

func RenderPage[T any](w http.ResponseWriter, _ *http.Request, title, templateName string, data *T) {
    RenderTemplate(w, title, templateName, data)
}

`;

        private static readonly homeHandler = `package page

import (
    "myapp/pkg/services"
    "net/http"
)

func HomePage() http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
    services.RenderPage[any](w, r, "Home", "web/templates/page/home.html", nil)
    }
}
`;
        private static readonly notFoundHandler = `package page

import (
    "myapp/pkg/services"
    "net/http"
)

func Error404Page() http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
    services.RenderPage[any](w, r, "Not Found", "web/templates/page/404.html", nil)
    }
}
`;
        private static readonly serverErrorHandler = `package page

import (
    "myapp/pkg/services"
    "net/http"
)

func Error500Page() http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
    services.RenderPage[any](w, r, "Server Error", "web/templates/page/500.html", nil)
    }
}
`;
        private static readonly getPagination = `package services

import (
    "net/http"
    "strconv"
)

func GetPagination(r *http.Request, defaultLimit, defaultPage int) (offset, limit, page int) {
    limit = defaultLimit
    page = defaultPage

    limitStr := r.URL.Query().Get("limit")
    if limitStr != "" {
        if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
            limit = parsedLimit
        }
    }

    pageStr := r.URL.Query().Get("page")
    if pageStr != "" {
        if parsedPage, err := strconv.Atoi(pageStr); err == nil && parsedPage > 0 {
            page = parsedPage
        }
    }

    offset = (page - 1) * limit
    return offset, limit, page
}

`;
        private static readonly paginationModel = `package models
        
type Pagination[T any] struct {
	Items          *[]T \`json:"items"\`
    CurrentPage    int  \`json:"current_page"\`
    TotalPages     int  \`json:"total_pages"\`
    TotalCount     int  \`json:"total_count"\`
    Limit          int  \`json:"limit"\`
    PreviousPage   int  \`json:"previous_page"\`
    NextPage       int  \`json:"next_page"\`
	ShowFirst      bool
	ShowPrevious   bool
	ShowNext       bool
	ShowLast       bool
} 
`;
        private static readonly paginationTemplate = `{{ define "pagination" }}

<nav class="pagination" role="navigation" aria-label="pagination">
    <!-- Previous Button -->
    {{ if .Data.ShowPrevious }}
    <a
        href="?page={{ .Data.PreviousPage }}&limit={{ .Data.Limit }}"
        class="pagination-previous"
        >Previous</a
    >
    {{ else }}
    <a href="#" class="pagination-previous is-disabled" aria-disabled="true"
        >Previous</a
    >
    {{ end }}

    <!-- Next Button -->
    {{ if .Data.ShowNext }}
    <a
        href="?page={{ .Data.NextPage }}&limit={{ .Data.Limit }}"
        class="pagination-next"
        >Next page</a
    >
    {{ else }}
    <a href="#" class="pagination-next is-disabled" aria-disabled="true"
        >Next page</a
    >
    {{ end }}

    <ul class="pagination-list">
        <!-- First Page -->
        {{ if .Data.ShowFirst }}
        <li>
            <a
                href="?page=1&limit={{ .Data.Limit }}"
                class="pagination-link"
                aria-label="Goto page 1"
                >1</a
            >
        </li>
        {{ end }}

        <!-- Ellipsis if the current page is greater than 2 -->
        {{ if .Data.ShowFirst }}
        <li>
            <span class="pagination-ellipsis">&hellip;</span>
        </li>
        {{ end }}

        <!-- Previous Page -->
        {{ if .Data.ShowPrevious }}
        <li>
            <a
                href="?page={{ .Data.PreviousPage }}&limit={{ .Data.Limit }}"
                class="pagination-link"
                aria-label="Goto page {{ .Data.PreviousPage }}"
                >{{ .Data.PreviousPage }}</a
            >
        </li>
        {{ end }}

        <!-- Current Page -->
        <li>
            <a
                class="pagination-link is-current"
                aria-label="Page {{ .Data.CurrentPage }}"
                aria-current="page"
                >{{ .Data.CurrentPage }}</a
            >
        </li>

        <!-- Next Page -->
        {{ if .Data.ShowNext }}
        <li>
            <a
                href="?page={{ .Data.NextPage }}&limit={{ .Data.Limit }}"
                class="pagination-link"
                aria-label="Goto page {{ .Data.NextPage }}"
                >{{ .Data.NextPage }}</a
            >
        </li>
        {{ end }}

        <!-- Ellipsis if the current page is not the last -->
        {{ if .Data.ShowLast }}
        <li>
            <span class="pagination-ellipsis">&hellip;</span>
        </li>
        {{ end }}

        <!-- Last Page -->
        {{ if .Data.ShowLast }}
        <li>
            <a
                href="?page={{ .Data.TotalPages }}&limit={{ .Data.Limit }}"
                class="pagination-link"
                aria-label="Goto page {{ .Data.TotalPages }}"
                >{{ .Data.TotalPages }}</a
            >
        </li>
        {{ end }}
    </ul>
</nav>

{{ end }}

`;
}
