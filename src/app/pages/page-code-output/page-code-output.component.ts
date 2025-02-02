import { Component, ViewChild, ElementRef, inject, AfterViewInit, OnDestroy } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import hljs from 'highlight.js'
import { Subscription } from 'rxjs'
import { DataService } from '../../services/data.service'
import { AppGeneratorMode } from '../../structure'
import { SchemasToAngularFormControls } from '../../../generators/angular.form.controls'
import { SchemasToApiGoPostgres } from '../../../generators/api.go.postgres'
import { SchemasToCSClasses } from '../../../generators/cs.class'
import { SchemasToGoStructs } from '../../../generators/go.structs.fns'
import { SchemasToJsClasses } from '../../../generators/js.class'
import { SchemasToSqlFuncs } from '../../../generators/pgsql.functions'
import { SchemasToPostgresSeed } from '../../../generators/pgsql.seed'
import { SchemasToPostgreSQL } from '../../../generators/pgsql.tables'
import { SchemasToRustStructsImpl } from '../../../generators/rust.structs.impls'
import { SchemasToSQLiteJoinQuery } from '../../../generators/sqlite.join.query'
import { SchemasToTablesForSQLite } from '../../../generators/sqlite.tables'
import { SchemasToTsClasses } from '../../../generators/ts.class'
import { SchemasToTsTypesAndFns } from '../../../generators/ts.types.fns'
import { SchemasToTSQLStoredProcedures } from '../../../generators/tsql.stored.procedures'
import { SchemasToTablesForTSQL } from '../../../generators/tsql.tables'
import { MatTabsModule } from '@angular/material/tabs'
import { SideBarService } from '../../services/side-bar.service'
import { MatChipsModule } from '@angular/material/chips'
import { MatIconModule } from '@angular/material/icon'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IsSeedModePipe } from '../../pipes/is-seed-mode.pipe'
import { MatSliderModule } from '@angular/material/slider'
import { MatSnackBar } from '@angular/material/snack-bar'
import { AppService } from '../../services/app.service'

@Component({
    selector: 'app-page-code-output',
    imports: [CommonModule, FormsModule, MatButtonModule, MatTabsModule, MatChipsModule, MatIconModule, IsSeedModePipe, MatSliderModule],
    templateUrl: './page-code-output.component.html',
    styleUrl: './page-code-output.component.scss'
})
export class PageCodeOutputComponent implements AfterViewInit, OnDestroy {
    output = ''
    subscription: Subscription | null = null
    @ViewChild('codeOutput') codeOutput?: ElementRef<HTMLPreElement>

    readonly dataService = inject(DataService)
    readonly sideBarService = inject(SideBarService)
    private readonly snackBar = inject(MatSnackBar)
    readonly appService = inject(AppService)

    ngAfterViewInit(): void {
        this.subscription = this.dataService.schemasChange.subscribe(schemas => {
            let ext = ''
            switch (this.dataService.app.generatorMode) {
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
                    this.output = SchemasToPostgresSeed(schemas, this.dataService.varcharMap, this.dataService.app.seedLimit)
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

        this.appService.EmitChangesForApp()
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe()
        }
    }

    copy() {
        navigator.clipboard.writeText(this.output)
        this.snackBar.open('Copied generate code to the clipboard', '', {
            duration: 2500
        })
    }

    selectedTabChanged(event: number) {
        this.sideBarService.generatorModeSelectedIndex = [event, 0]
        this.sideBarService.setGenMode()
    }
}
