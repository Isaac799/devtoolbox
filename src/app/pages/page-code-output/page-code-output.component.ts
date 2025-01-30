import {Component, ViewChild, ElementRef} from '@angular/core'
import {MatButtonModule} from '@angular/material/button'
import hljs from 'highlight.js'
import {Subscription} from 'rxjs'
import {DataService} from '../../services/data.service'
import {NotificationService} from '../../services/notification.service'
import {AppGeneratorMode, Notification, NotificationLife, NotificationKind} from '../../structure'
import {SchemasToAngularFormControls} from '../../../generators/angular.form.controls'
import {SchemasToApiGoPostgres} from '../../../generators/api.go.postgres'
import {SchemasToCSClasses} from '../../../generators/cs.class'
import {SchemasToGoStructs} from '../../../generators/go.structs.fns'
import {SchemasToJsClasses} from '../../../generators/js.class'
import {SchemasToSqlFuncs} from '../../../generators/pgsql.functions'
import {SchemasToPostgresSeed} from '../../../generators/pgsql.seed'
import {SchemasToPostgreSQL} from '../../../generators/pgsql.tables'
import {SchemasToRustStructsImpl} from '../../../generators/rust.structs.impls'
import {SchemasToSQLiteJoinQuery} from '../../../generators/sqlite.join.query'
import {SchemasToTablesForSQLite} from '../../../generators/sqlite.tables'
import {SchemasToTsClasses} from '../../../generators/ts.class'
import {SchemasToTsTypesAndFns} from '../../../generators/ts.types.fns'
import {SchemasToTSQLStoredProcedures} from '../../../generators/tsql.stored.procedures'
import {SchemasToTablesForTSQL} from '../../../generators/tsql.tables'

@Component({
    selector: 'app-page-code-output',
    imports: [MatButtonModule],
    templateUrl: './page-code-output.component.html',
    styleUrl: './page-code-output.component.scss'
})
export class PageCodeOutputComponent {
    output = ''
    subscription: Subscription | null = null
    @ViewChild('codeOutput') codeOutput?: ElementRef<HTMLPreElement>

    constructor(public data: DataService, private notification: NotificationService) {}
    ngAfterViewInit(): void {
        this.subscription = this.data.schemasChange.subscribe(schemas => {
            let ext = ''
            switch (this.data.app.generatorMode) {
                case AppGeneratorMode.Postgres:
                    this.output = SchemasToPostgreSQL(schemas)
                    ext = 'SQL'
                    break
                case AppGeneratorMode.GoStructsAndFns:
                    this.output = SchemasToGoStructs(schemas)
                    ext = 'GO'
                    break
                case AppGeneratorMode.TSTypesAndFns:
                    this.output = SchemasToTsTypesAndFns(schemas)
                    ext = 'TS'
                    break
                case AppGeneratorMode.TSClasses:
                    this.output = SchemasToTsClasses(schemas)
                    ext = 'TS'
                    break
                case AppGeneratorMode.JSClasses:
                    this.output = SchemasToJsClasses(schemas)
                    ext = 'JS'
                    break
                case AppGeneratorMode.PostgresFunctions:
                    this.output = SchemasToSqlFuncs(schemas)
                    ext = 'SQL'
                    break
                case AppGeneratorMode.AngularFormControl:
                    this.output = SchemasToAngularFormControls(schemas)
                    ext = 'TS'
                    break
                case AppGeneratorMode.TSQLTables:
                    this.output = SchemasToTablesForTSQL(schemas)
                    ext = 'SQL'
                    break
                case AppGeneratorMode.SQLiteTables:
                    this.output = SchemasToTablesForSQLite(schemas)
                    ext = 'SQL'
                    break
                case AppGeneratorMode.SQLiteJoinQuery:
                    this.output = SchemasToSQLiteJoinQuery(schemas)
                    ext = 'SQL'
                    break
                case AppGeneratorMode.TSQLStoredProcedures:
                    this.output = SchemasToTSQLStoredProcedures(schemas)
                    ext = 'SQL'
                    break
                case AppGeneratorMode.RustStructAndImpl:
                    this.output = SchemasToRustStructsImpl(schemas)
                    ext = 'RS'
                    break
                case AppGeneratorMode.CSClasses:
                    this.output = SchemasToCSClasses(schemas)
                    ext = 'CS'
                    break
                case AppGeneratorMode.APIGoPostgres:
                    this.output = SchemasToApiGoPostgres(schemas)
                    ext = 'CS'
                    break
                case AppGeneratorMode.PostgresSeed:
                    this.output = SchemasToPostgresSeed(schemas, this.data.varcharMap, this.data.app.seedLimit)
                    ext = 'SQL'
                    break
            }

            if (!this.codeOutput?.nativeElement) {
                console.error('Missing this.codeGeneratorViewHtml')
                return
            }
            const code = hljs.highlight(this.output, {language: ext}).value
            this.codeOutput.nativeElement.innerHTML = code
        })
    }

    ngOnInit(): void {
        this.data.EmitChangesForApp()
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe()
        }
    }

    copy() {
        navigator.clipboard.writeText(this.output)
        this.notification.Add(new Notification('Copied', 'The code was copied to your clipboard.', NotificationKind.Info, NotificationLife.Short))
    }
}
