import { trimAndRemoveBlankStrings } from '../core/formatting';
import { CodeGenerator } from '../core/structure';
import { GoApiCodeGenerator } from './go_api';
import { GoSSR } from './go_ssr';
import { GoSsrAssets } from './go_ssr_assets';
import { GoSsrRender } from './go_ssr_render';
import { GoSsrRouter } from './go_ssr_router';
import { GoTypesCodeGenerator } from './go_struct';

export class GoCodeGenerator extends CodeGenerator {
        goApi = new GoApiCodeGenerator();
        goStructs = new GoTypesCodeGenerator();
        goSSR = new GoSSR();
        goSsrAssets = new GoSsrAssets();
        goSsrRouter = new GoSsrRouter();
        goSsrRender = new GoSsrRender();

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
                let mainGo = `package main

import (
    "log"
    "net/http"
)

func main() {
    http.HandleFunc("/", router)

    log.Println("Server is listening on port 4001...")
    log.Fatal(http.ListenAndServe(":4001", nil))
}
`;

                this.output = {
                        'go.mod': goMod,
                        'main.go': mainGo,
                        ...goSsrRouter,
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
