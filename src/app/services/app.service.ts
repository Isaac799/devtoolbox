import {EventEmitter, inject, Injectable} from '@angular/core'
import {DataService} from './data.service'
import {TextEditorService} from './text-editor.service'
import {PageTextEditorComponent} from '../pages/page-text-editor/page-text-editor.component'
import {App, AppGeneratorMode, AppComplexityMode, Schema, TableGuiMeta, SchemaGuiMeta} from '../structure'

@Injectable({
    providedIn: 'root'
})
export class AppService {
    private readonly dataService = inject(DataService)
    private readonly textEditorService = inject(TextEditorService)
    readonly doRenderGenerated = new EventEmitter<Schema[]>()

    private readonly preferencesKey = 'devtoolboxAppConfig'
    private readonly stateKey = 'state'
    private readonly tableGuiMetaKey = 'tableGuiMeta'
    private readonly schemaGuiMetaKey = 'schemaGuiMeta'

    private tableGuiMeta: TableGuiMeta[] = []
    private schemaGuiMeta: SchemaGuiMeta[] = []

    app: App = {
        seedLimit: 4,
        canvasSize: {
            name: 'small',
            x: 1920,
            y: 1080
        },

        textEditorState: 1,
        generatorMode: AppGeneratorMode.Postgres,
        complexity: AppComplexityMode.Advanced,
        editor: {
            gui: false,
            splitTui: true
        }
    }
    private _initialized = false
    public get initialized() {
        return this._initialized
    }
    private set initialized(value) {
        this._initialized = value
    }
    private runDebounce: ReturnType<typeof setTimeout> | undefined = undefined
    private refreshOutDebounce: ReturnType<typeof setTimeout> | undefined = undefined
    private readonly defaultConfig = `
# Library

## Author
- id as ++
- first name as str with u:a, r, ..30
- last name as str with u:a, u:b, r, 4..30

## Book
- id as ++
- title as str with u, r, ..50
- @author with r
- co author as author
`.trim()

    Initialize() {
        if (this.initialized) {
            return
        }

        this.loadPreferences()
        this.textEditorService.LoadLastTextEdit()

        setTimeout(() => {
            const config = localStorage.getItem(this.stateKey)

            try {
                if (!config) throw new Error('missing config')
                const parsed = JSON.parse(config)
                const schemas = DataService.ParseSchemaConfig(parsed)
                this.textEditorService.textInput = PageTextEditorComponent.reverseParse(schemas, this.app.textEditorState)
            } catch {
                if (!this.dataService.schemas.length && !this.textEditorService.textInput) {
                    this.textEditorService.textInput = this.defaultConfig
                } else if (!this.textEditorService.textInput) {
                    this.textEditorService.textInput = PageTextEditorComponent.reverseParse(this.dataService.schemas, this.app.textEditorState)
                    this.Save()
                }
            }

            this.Run('txt')
            this.RestoreGuiMeta()
            this.initialized = true
        }, 0)
    }

    Run(src: 'txt' | 'gui') {
        if (src === 'txt') {
            /**
             *
             * Things we want to do NOW for rendering purposes
             *
             */
            this.textEditorService.justCleaned = false
            const r = PageTextEditorComponent.parse(this.textEditorService.textInput)
            if (typeof r === 'string') {
                this.textEditorService.fromMacro = true
                this.textEditorService.textInput = r
                this.Run('txt')
                this.textEditorService.fromMacro = false
                return
            }

            this.dataService.previousParse = r
            this.textEditorService.doRender.next()

            if (this.dataService.schemas.length === 0) {
                this._run()
                return
            }
            clearTimeout(this.runDebounce)
            this.runDebounce = setTimeout(() => {
                this._run()
            }, 300)
            return
        }

        const p = DataService.parseSchemasConfig(this.dataService.schemas)

        this.dataService.previousParse = {
            data: p,
            suggestions: [],
            errors: []
        }

        if (this.dataService.schemas.length === 0) {
            this._run()
            return
        }

        clearTimeout(this.runDebounce)

        const str = PageTextEditorComponent.reverseParse(this.dataService.schemas, this.app.textEditorState)
        this.textEditorService.textInput = str

        this.runDebounce = setTimeout(() => {
            this._run()
        }, 300)

        this.SaveGuiMeta()
    }

    private _run() {
        const data = this.dataService.previousParse?.data
        if (!data) {
            return
        }
        this.dataService.schemas = DataService.ParseSchemaConfig(data)
        this.doRenderGenerated.next(this.dataService.schemas)
        this.Save()
    }

    Save() {
        this.savePreferences()
        this.saveGUI()
        this.textEditorService.SaveLastTextEdit()
        if (this.dataService.previousParse) {
            localStorage.setItem(this.stateKey, JSON.stringify(this.dataService.previousParse.data))
        }
    }

    private saveGUI() {
        const p = DataService.parseSchemasConfig(this.dataService.schemas)
        const s = JSON.stringify(p)
        localStorage.setItem(this.stateKey, s)
    }

    RestoreGuiMeta() {
        settingTableMeta: try {
            const str = localStorage.getItem(this.tableGuiMetaKey)
            if (!str) break settingTableMeta

            const parsed = JSON.parse(str)

            for (const s of this.dataService.schemas) {
                for (const t of s.Tables) {
                    const search = t.FN
                    const pos = parsed.find((e: any) => e?.id === search)
                    if (!pos) {
                        // console.info('missing table for saved position, skipped')
                        continue
                    }
                    t.dragPosition.x = pos.x
                    t.dragPosition.y = pos.y
                }
            }
        } catch (err) {
            console.error(err)
            localStorage.removeItem(this.tableGuiMetaKey)
        }

        settingSchemaMeta: try {
            const str = localStorage.getItem(this.schemaGuiMetaKey)
            if (!str) break settingSchemaMeta

            const parsed = JSON.parse(str)

            for (const s of this.dataService.schemas) {
                const pp = parsed.find((e: any) => e?.id === s.Name)
                if (pp) {
                    s.Color = pp.Color
                }
            }
        } catch (err) {
            console.error(err)
            localStorage.removeItem(this.schemaGuiMetaKey)
        }
    }

    SaveGuiMeta() {
        if (!this.initialized) return

        this.tableGuiMeta = []
        this.schemaGuiMeta = []
        for (const s of this.dataService.schemas) {
            this.schemaGuiMeta.push({
                id: s.Name,
                Color: s.Color
            })
            for (const t of s.Tables) {
                this.tableGuiMeta.push({
                    id: t.FN,
                    ...t.dragPosition
                })
            }
        }

        const s2 = JSON.stringify(this.tableGuiMeta)
        localStorage.setItem(this.tableGuiMetaKey, s2)

        const s3 = JSON.stringify(this.schemaGuiMeta)
        localStorage.setItem(this.schemaGuiMetaKey, s3)
    }

    RefreshOutput() {
        clearTimeout(this.refreshOutDebounce)
        this.refreshOutDebounce = setTimeout(() => {
            this.doRenderGenerated.next(this.dataService.schemas)
        }, 300)
    }

    private loadPreferences() {
        const save = localStorage.getItem(this.preferencesKey)
        if (!save) {
            return
        }
        try {
            const parsed = JSON.parse(save)
            if (!parsed) {
                throw new Error('failed parsing app config')
            }
            if (!parsed['seedLimit']) {
                parsed['seedLimit'] = 4
            }
            if (!parsed['canvasSize']) {
                parsed['canvasSize'] = {
                    name: 'small',
                    x: 1920,
                    y: 1080
                }
            }
            if (!parsed['generatorMode']) {
                parsed['generatorMode'] = AppGeneratorMode.Postgres
            }
            if (!parsed['complexity']) {
                parsed['complexity'] = AppComplexityMode.Advanced
            }
            if (!parsed['textEditorState']) {
                parsed['textEditorState'] = 1
            }

            this.app = parsed
            if (!this.app.editor) {
                this.app.editor = {
                    gui: false,
                    splitTui: true
                }
            }
        } catch (err) {
            console.error(err)
            localStorage.removeItem(this.preferencesKey)
        }
    }

    private savePreferences() {
        const s = JSON.stringify(this.app, null, 2)
        if (s) {
            localStorage.setItem(this.preferencesKey, s)
        }
    }

    CompareWithID<T extends {ID: string}>(a: T, b: T) {
        if (!a || !b) return false
        return a.ID === b.ID
    }

    constructor() {
        for (const e of this.generatorModeOptions) {
            if (e.value !== this.app.generatorMode) {
                continue
            }
            this.generatorModeSelected = e.value
        }
    }

    setGenMode() {
        const c = this.generatorModeOptions.find(e => e.value === this.generatorModeSelected)
        if (!c) {
            this.generatorModeSelected = 0
            this.setGenMode()
            return
        }
        this.app.generatorMode = c.value
        this.RefreshOutput()
    }

    generatorModeSelected = 0
    generatorModeOptions: {title: string; icon?: string; value: AppGeneratorMode}[] = [
        {
            title: 'Postgres - Tables',
            icon: 'star',
            value: AppGeneratorMode.Postgres
        },
        // {
        //     title: 'Postgres - Functions',
        //     value: AppGeneratorMode.PostgresFunctions
        // },
        {
            title: 'Postgres - Seed',
            icon: 'star',
            value: AppGeneratorMode.PostgresSeed
        },
        // {
        //     title: 'MS SQL - Tables',
        //     value: AppGeneratorMode.TSQLTables
        // },
        // {
        //     title: 'SQLite - Tables',
        //     value: AppGeneratorMode.SQLiteTables
        // },
        // {
        //     title: 'SQLite - Queries',
        //     value: AppGeneratorMode.SQLiteJoinQuery
        // },
        {
            title: 'JS - Classes',
            value: AppGeneratorMode.JSClasses
        },
        {
            title: 'TS - Classes',
            value: AppGeneratorMode.TSClasses
        },
        {
            title: 'TS - Types & new functions',
            value: AppGeneratorMode.TSTypesAndFns
        },
        {
            title: 'TS - Angular reactive form',
            value: AppGeneratorMode.AngularFormControl
        },
        // {
        //     title: 'C# Classes',
        //     value: AppGeneratorMode.CSClasses
        // },
        {
            title: ' Go - Structs & new functions',
            value: AppGeneratorMode.GoStructsAndFns
        },
        // {
        //     title: ' Go - HTTP handlers using PostgreSQL',
        //     icon: 'star',
        //     value: AppGeneratorMode.APIGoPostgres
        // },
        {
            title: 'HTML - Fields',
            value: AppGeneratorMode.HTMLRaw
        },
        {
            title: 'HTML - Fields (Bulma v1)',
            value: AppGeneratorMode.HTMLRawBulma01
        }
        // {
        //     title: 'Angular reactive form',
        //     value: AppGeneratorMode.HTMLAngularReactive
        // },
        // {
        //     title: 'Go Template',
        //     value: AppGeneratorMode.GoTemplateHTML
        // },
        // {
        //     title: 'Go Template (Bulma v1)',
        //     value: AppGeneratorMode.GoTemplateBulma01HTML
        // },
        // {
        //     title: 'Rust - Structs & impl functions',
        //     value: AppGeneratorMode.RustStructAndImpl
        // }
    ]
}
