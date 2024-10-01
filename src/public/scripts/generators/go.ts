import { trimAndRemoveBlankStrings } from '../core/formatting';
import { CodeGenerator } from '../core/structure';
import { GoJSON } from './go_json';
import { GoDatabase } from './go_db';
import { GoMiddleware } from './go_middleware';
import { GoSSR } from './go_ssr';
import { GoTemplates } from './go_templates';
import { GoHTML } from './go_html';
import { GoRouter } from './go_router';
import { GoPkg } from './go_pkg';

export class GoCodeGenerator extends CodeGenerator {
        goApi = new GoJSON();
        goStructs = new GoPkg();
        goSSR = new GoSSR();
        goDatabase = new GoDatabase();
        goSsrAssets = new GoTemplates();
        goSsrRouter = new GoRouter();
        goSsrRender = new GoHTML();
        goMiddleware = new GoMiddleware();

        Run() {
                let goApi = this.goApi.Clear().SetInput(this.input).Run().Read();
                goApi = trimAndRemoveBlankStrings(goApi);

                let goStructs = this.goStructs.Clear().SetInput(this.input).Run().Read();
                goStructs = trimAndRemoveBlankStrings(goStructs);

                let goSSR = this.goSSR.Clear().SetInput(this.input).Run().Read();
                goSSR = trimAndRemoveBlankStrings(goSSR);

                let goSsrAssets = this.goSsrAssets.Clear().SetInput(this.input).Run().Read();
                goSsrAssets = trimAndRemoveBlankStrings(goSsrAssets);

                let goSsrRouter = this.goSsrRouter.Clear().SetInput(this.input).Run().Read();
                goSsrRouter = trimAndRemoveBlankStrings(goSsrRouter);

                let goSsrRender = this.goSsrRender.Clear().SetInput(this.input).Run().Read();
                goSsrRender = trimAndRemoveBlankStrings(goSsrRender);

                let goDatabase = this.goDatabase.Clear().SetInput(this.input).Run().Read();
                goDatabase = trimAndRemoveBlankStrings(goDatabase);

                let goMiddleware = this.goMiddleware.Clear().SetInput(this.input).Run().Read();
                goMiddleware = trimAndRemoveBlankStrings(goMiddleware);

                //                 let headerInfo = `package main

                // import (
                //     "database/sql"
                //     "encoding/json"
                //     "log"
                //     "net/http"

                //     _ "github.com/lib/pq"
                // )

                // var db *sql.DB

                // func initDB() {
                //     var err error
                //     connStr := "user=username dbname=mydb sslmode=disable"
                //     db, err = sql.Open("postgres", connStr)
                //     if err != nil {
                //         log.Fatal(err)
                //     }
                // }`;

                //                 allParts.push(headerInfo);

                //                 const main = `func main() {
                //                         initDB()
                //                         defer db.Close()
                //                     ${endpointStrs.join('\n')}

                //                         log.Fatal(http.ListenAndServe(":8080", nil))
                //                     }`;

                //                                     allParts.push(main);

                let goMod = `module mysite

go 1.21.13
`;
                let goSum = `github.com/gorilla/mux v1.8.1 h1:TuBL49tXwgrFYWhqrNgrUNEY92u81SPhu7sTdzQEiWY=
github.com/gorilla/mux v1.8.1/go.mod h1:AKf9I4AEqPTmMytcMc0KkNouC66V3BtZ4qD5fmWSiMQ=
github.com/lib/pq v1.10.9 h1:YXG7RB+JIjhP29X+OtkiDnYaXQwpS4JEWq7dtCCRUEw=
github.com/lib/pq v1.10.9/go.mod h1:AlVN5x4E4T544tWzH6hKfbfQvm3HdbOxrmggDNAPY9o=
`;
                let mainGo = `package main

import (
    "log"
    "net/http"
)

func (a *App) Run(addr string) {
    log.Fatal(http.ListenAndServe(addr, a.Router))
}

func main() {
    dbConfig := DBConfig{
        User:     "postgres",
        Password: "postgres",
        DBName:   "postgres",
        Host:     "localhost",
        Port:     "5432",
    }

    db, err := NewDB(dbConfig)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    app := &App{
        Router: mux.NewRouter(),
        DB:     db,
    }

    app.InitializeRoutes()
    app.Run(":8080")
}
`;

                this.output = {
                        'go.mod': goMod,
                        'go.sum': goSum,
                        '/cmd/mysite/main.go': mainGo,
                        ...goDatabase,
                        ...goSsrRouter,
                        ...goMiddleware,
                        ...goApi,
                        ...goSsrRender,
                        ...goStructs,
                        ...goSSR,
                        ...goSsrAssets,
                };

                // console.log('this.output :>> ', Object.keys(this.output));
                // let o = groupData(this.output);
                // console.log('o :>> ', o);

                return this;
        }
}
