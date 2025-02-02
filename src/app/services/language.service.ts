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
import {generateAttributeMap, VarcharJSONData} from '../varchar'
import varcharJSON from '../../../public/varchar.json'

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    varcharMap: AttributeMap = new Map()

    // private readonly languageCsService = inject(LanguageCsService)
    // private readonly languageGoService = inject(LanguageGoService)
    // private readonly languageJsService = inject(LanguageJsService)
    // private readonly languageTsService = inject(LanguageTsService)
    // private readonly languageRustService = inject(LanguageRustService)
    // private readonly languagePsqlService = inject(LanguagePsqlService)
    // private readonly languageTsqlService = inject(LanguageTsqlService)
    // private readonly languageSqliteService = inject(LanguageSqliteService)

    constructor() {
        let all: VarcharJSONData = {}
        for (const e of Object.values(varcharJSON)) {
            all = {
                ...all,
                ...e
            }
        }
        this.varcharMap = generateAttributeMap(all)
    }

    GenerateCode(
        schemas: Schema[],
        mode: AppGeneratorMode,
        seedLimit: number
    ): {
        code: string
        html: string
    } {
        let ext = ''
        let output = ''

        switch (mode) {
            case AppGeneratorMode.Postgres:
                output = LanguagePsqlService.ToTables(schemas)
                ext = 'SQL'
                break
            case AppGeneratorMode.GoStructsAndFns:
                output = LanguageGoService.ToStructs(schemas)
                ext = 'GO'
                break
            case AppGeneratorMode.TSTypesAndFns:
                output = LanguageTsService.ToFunctions(schemas)
                ext = 'TS'
                break
            case AppGeneratorMode.TSClasses:
                output = LanguageTsService.ToClasses(schemas)
                ext = 'TS'
                break
            case AppGeneratorMode.JSClasses:
                output = LanguageJsService.ToClasses(schemas)
                ext = 'JS'
                break
            case AppGeneratorMode.PostgresFunctions:
                output = LanguagePsqlService.ToFunctions(schemas)
                ext = 'SQL'
                break
            case AppGeneratorMode.AngularFormControl:
                output = LanguageTsService.ToAngularFormControls(schemas)
                ext = 'TS'
                break
            case AppGeneratorMode.TSQLTables:
                output = LanguageTsqlService.ToTables(schemas)
                ext = 'SQL'
                break
            case AppGeneratorMode.SQLiteTables:
                output = LanguageSqliteService.ToTables(schemas)
                ext = 'SQL'
                break
            case AppGeneratorMode.SQLiteJoinQuery:
                output = LanguageSqliteService.ToJoinQuery(schemas)
                ext = 'SQL'
                break
            case AppGeneratorMode.TSQLStoredProcedures:
                output = LanguageTsqlService.ToStoredProcedures(schemas)
                ext = 'SQL'
                break
            case AppGeneratorMode.RustStructAndImpl:
                output = LanguageRustService.ToStructs(schemas)
                ext = 'RS'
                break
            case AppGeneratorMode.CSClasses:
                output = LanguageCsService.ToClasses(schemas)
                ext = 'CS'
                break
            case AppGeneratorMode.APIGoPostgres:
                output = LanguageGoService.ToAPIWithPostgres(schemas)
                ext = 'CS'
                break
            case AppGeneratorMode.PostgresSeed:
                output = LanguagePsqlService.ToSeed(schemas, this.varcharMap, seedLimit)
                ext = 'SQL'
                break
        }

        const code = hljs.highlight(output, {language: ext}).value
        return {
            html: code,
            code: output
        }
    }
}
