import {EventEmitter, inject, Injectable} from '@angular/core'
import {DataService} from './data.service'
import {TextEditorService} from './text-editor.service'
import {PageTextEditorComponent} from '../pages/page-text-editor/page-text-editor.component'
import {App, AppGeneratorMode, AppComplexityMode, Schema, TablePosition} from '../structure'

@Injectable({
    providedIn: 'root'
})
export class AppService {
    private readonly dataService = inject(DataService)
    private readonly textEditorService = inject(TextEditorService)
    readonly doRenderGenerated = new EventEmitter<Schema[]>()

    private readonly preferencesKey = 'devtoolboxAppConfig'
    private readonly stateKey = 'state'
    private readonly tablePositionKey = 'tablePosition'
    tablePositions: TablePosition[] = []

    app: App = {
        seedLimit: 4,
        canvasSize: {
            name: 'small',
            x: 1920,
            y: 1080
        },
        textEditorState: 1,
        generatorMode: AppGeneratorMode.Postgres,
        complexity: AppComplexityMode.Advanced
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
            this.RestoreDragPos()
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
        this.runDebounce = setTimeout(() => {
            this._run()
        }, 300)

        this.SaveDragPos()
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

    RestoreDragPos() {
        settingHuiPos: try {
            const tblPosStr = localStorage.getItem(this.tablePositionKey)
            if (!tblPosStr) break settingHuiPos

            const tablePos = JSON.parse(tblPosStr)

            for (const s of this.dataService.schemas) {
                for (const t of s.Tables) {
                    const search = t.FN
                    const pos = tablePos.find((e: any) => {
                        return e?.id === search
                    })
                    if (!pos) {
                        console.warn('missing table for saved position, skipped')
                        continue
                    }
                    t.dragPosition.x = pos.x
                    t.dragPosition.y = pos.y
                }
            }
        } catch (err) {
            console.error(err)
            localStorage.removeItem(this.tablePositionKey)
        }
    }
    SaveDragPos() {
        if (!this.initialized) return

        this.tablePositions = []
        for (const s of this.dataService.schemas) {
            for (const t of s.Tables) {
                this.tablePositions.push({
                    id: t.FN,
                    ...t.dragPosition
                })
            }
        }

        const s2 = JSON.stringify(this.tablePositions)
        localStorage.setItem(this.tablePositionKey, s2)
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
}
