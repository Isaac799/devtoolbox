import {Injectable} from '@angular/core'
import {LanguageCsService} from './language/language-cs.service'
import {LanguageGoService} from './language/language-go.service'
import {LanguageJsService} from './language/language-js.service'
import {LanguagePsqlService} from './language/language-psql.service'
import {LanguageRustService} from './language/language-rust.service'
import {LanguageSqliteService} from './language/language-sqlite.service'
import {LanguageTsService} from './language/language-ts.service'
import {LanguageTsqlService} from './language/language-tsql.service'
import {AppGeneratorMode, Schema} from '../structure'
import hljs from 'highlight.js'
import {AttributeMap} from '../varchar'

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private _output = ''
    public get output() {
        return this._output
    }
    private set output(value) {
        this._output = value
    }

    // private readonly languageCsService = inject(LanguageCsService)
    // private readonly languageGoService = inject(LanguageGoService)
    // private readonly languageJsService = inject(LanguageJsService)
    // private readonly languageTsService = inject(LanguageTsService)
    // private readonly languageRustService = inject(LanguageRustService)
    // private readonly languagePsqlService = inject(LanguagePsqlService)
    // private readonly languageTsqlService = inject(LanguageTsqlService)
    // private readonly languageSqliteService = inject(LanguageSqliteService)

    GenerateCode(schemas: Schema[], mode: AppGeneratorMode, seedLimit: number, varcharMap: AttributeMap) {
        let ext = ''
        switch (mode) {
            case AppGeneratorMode.Postgres:
                this.output = LanguagePsqlService.ToTables(schemas)
                ext = 'SQL'
                break
            case AppGeneratorMode.GoStructsAndFns:
                this.output = LanguageGoService.ToStructs(schemas)
                ext = 'GO'
                break
            case AppGeneratorMode.TSTypesAndFns:
                this.output = LanguageTsService.ToFunctions(schemas)
                ext = 'TS'
                break
            case AppGeneratorMode.TSClasses:
                this.output = LanguageTsService.ToClasses(schemas)
                ext = 'TS'
                break
            case AppGeneratorMode.JSClasses:
                this.output = LanguageJsService.ToClasses(schemas)
                ext = 'JS'
                break
            case AppGeneratorMode.PostgresFunctions:
                this.output = LanguagePsqlService.ToFunctions(schemas)
                ext = 'SQL'
                break
            case AppGeneratorMode.AngularFormControl:
                this.output = LanguageTsService.ToAngularFormControls(schemas)
                ext = 'TS'
                break
            case AppGeneratorMode.TSQLTables:
                this.output = LanguageTsqlService.ToTables(schemas)
                ext = 'SQL'
                break
            case AppGeneratorMode.SQLiteTables:
                this.output = LanguageSqliteService.ToTables(schemas)
                ext = 'SQL'
                break
            case AppGeneratorMode.SQLiteJoinQuery:
                this.output = LanguageSqliteService.ToJoinQuery(schemas)
                ext = 'SQL'
                break
            case AppGeneratorMode.TSQLStoredProcedures:
                this.output = LanguageTsqlService.ToStoredProcedures(schemas)
                ext = 'SQL'
                break
            case AppGeneratorMode.RustStructAndImpl:
                this.output = LanguageRustService.ToStructs(schemas)
                ext = 'RS'
                break
            case AppGeneratorMode.CSClasses:
                this.output = LanguageCsService.ToClasses(schemas)
                ext = 'CS'
                break
            case AppGeneratorMode.APIGoPostgres:
                this.output = LanguageGoService.ToAPIWithPostgres(schemas)
                ext = 'CS'
                break
            case AppGeneratorMode.PostgresSeed:
                this.output = LanguagePsqlService.ToSeed(schemas, varcharMap, seedLimit)
                ext = 'SQL'
                break
        }

        const code = hljs.highlight(this.output, {language: ext}).value
        return code
    }
}
