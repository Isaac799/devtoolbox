import { organizeObjectByKeys, trimAndRemoveBlankStrings } from '../../core/formatting';
import { CodeGenerator } from '../../core/structure';
import { GoJSON } from './go_json';
import { GoDatabase } from './go_db';
import { GoMiddleware } from './go_middleware';
import { GoSSR } from './go_ssr';
import { GoTemplates } from './go_templates';
import { GoHTML } from './go_html';
import { GoRouter } from './go_router';
import { GoPkgModel } from './go_pkg_model';
import { GoPkgRepositories } from './go_pkg_repositories';
import { GoFormData } from './go_form_data';
import { GoPkgValidation } from './go_pkg_validation';

export class GoCodeGenerator extends CodeGenerator {
        goJSON = new GoJSON();
        goPkgModel = new GoPkgModel();
        goSSR = new GoSSR();
        goDatabase = new GoDatabase();
        goTemplates = new GoTemplates();
        goRouter = new GoRouter();
        goHTML = new GoHTML();
        goMiddleware = new GoMiddleware();
        goPkgRepositories = new GoPkgRepositories();
        goFormData = new GoFormData();
        goPkgValidation = new GoPkgValidation();

        Run() {
                let goJSON = this.goJSON.Clear().SetInput(this.input).Run().Read();
                goJSON = trimAndRemoveBlankStrings(goJSON);

                let goPkgModel = this.goPkgModel.Clear().SetInput(this.input).Run().Read();
                goPkgModel = trimAndRemoveBlankStrings(goPkgModel);

                let goSSR = this.goSSR.Clear().SetInput(this.input).Run().Read();
                goSSR = trimAndRemoveBlankStrings(goSSR);

                let goTemplates = this.goTemplates.Clear().SetInput(this.input).Run().Read();
                goTemplates = trimAndRemoveBlankStrings(goTemplates);

                let goRouter = this.goRouter.Clear().SetInput(this.input).Run().Read();
                goRouter = trimAndRemoveBlankStrings(goRouter);

                let goHTML = this.goHTML.Clear().SetInput(this.input).Run().Read();
                goHTML = trimAndRemoveBlankStrings(goHTML);

                let goDatabase = this.goDatabase.Clear().SetInput(this.input).Run().Read();
                goDatabase = trimAndRemoveBlankStrings(goDatabase);

                let goMiddleware = this.goMiddleware.Clear().SetInput(this.input).Run().Read();
                goMiddleware = trimAndRemoveBlankStrings(goMiddleware);

                let goPkgRepositories = this.goPkgRepositories.Clear().SetInput(this.input).Run().Read();
                goPkgRepositories = trimAndRemoveBlankStrings(goPkgRepositories);

                let goFormData = this.goFormData.Clear().SetInput(this.input).Run().Read();
                goFormData = trimAndRemoveBlankStrings(goFormData);

                let goPkgValidation = this.goPkgValidation.Clear().SetInput(this.input).Run().Read();
                goPkgValidation = trimAndRemoveBlankStrings(goPkgValidation);

                let goMod = `module myapp

go 1.23.2
`;
                let goSum = `github.com/lib/pq v1.10.9 h1:YXG7RB+JIjhP29X+OtkiDnYaXQwpS4JEWq7dtCCRUEw=
github.com/lib/pq v1.10.9/go.mod h1:AlVN5x4E4T544tWzH6hKfbfQvm3HdbOxrmggDNAPY9o=
`;
                let mainGo = `package main

import (
    "log"
    "net/http"

    "myapp/internal/config"
    "myapp/internal/routes"

    _ "github.com/lib/pq"
)

func main() {
    dbConfig := config.DBConfig{
        User:     "postgres",
        Password: "postgres",
        DBName:   "postgres",
        Host:     "localhost",
        Port:     "5432",
    }

    db, err := config.NewDB(dbConfig)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    app := &config.App{
        Router: http.NewServeMux(),
        DB:     db,
    }

    routes.SetupRoutes(app.Router, db)
    if err := http.ListenAndServe(":8080", app.Router); err != nil {
        log.Fatal(err)
    }
}
`;

                let appModel = `package config

import (
    "database/sql"
    "log"
    "net/http"
)

type App struct {
    Router *http.ServeMux
    DB     *sql.DB
}

func (a *App) Run(addr string) {
    log.Fatal(http.ListenAndServe(addr, a.Router))
}
`;

                let migration = 'package migration\n\n// todo ';
                let test = 'package test\n\n// todo ';
                let readme = 'todo';

                let lowerFiles = {
                        '/cmd/mysite/main.go': mainGo,
                        '/internal/config/app.go': appModel,
                        ...goRouter,
                        ...goFormData,
                        ...goDatabase,
                        ...goMiddleware,
                        ...goPkgRepositories,
                        ...goJSON,
                        ...goHTML,
                        ...goPkgModel,
                        ...goSSR,
                        ...goTemplates,
                        ...goPkgValidation,
                        '/scripts/migrate.go': migration,
                        '/test/test_handler_x.go': test,
                        'readme.md': readme,
                };

                lowerFiles = organizeObjectByKeys(lowerFiles);

                this.output = {
                        'go.mod': goMod,
                        'go.sum': goSum,
                        ...lowerFiles,
                };

                // console.log('this.output :>> ', Object.keys(this.output));
                // let o = groupData(this.output);
                // console.log('o :>> ', o);

                return this;
        }
}
