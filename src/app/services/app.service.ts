import {EventEmitter, inject, Injectable} from '@angular/core'
import {DataService} from './data.service'
import {TextEditorService} from './text-editor.service'
import {PageTextEditorComponent} from '../pages/page-text-editor/page-text-editor.component'
import {App, AppMode, AppGeneratorMode, AppComplexityMode, Schema} from '../structure'

@Injectable({
    providedIn: 'root'
})
export class AppService {
    private readonly dataService = inject(DataService)
    private readonly textEditorService = inject(TextEditorService)
    readonly doRenderGenerated = new EventEmitter<Schema[]>()

    readonly preferencesKey = 'devtoolboxAppConfig'

    app: App = {
        seedLimit: 4,
        mode: AppMode.YAML,
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
- @author
- co author as author
`.trim()

    Initialize() {
        if (this.initialized) {
            return
        }
        this.loadPreferences()
        this.textEditorService.LoadLastTextEdit()

        setTimeout(() => {
            if (!this.dataService.schemas.length && !this.textEditorService.textInput) {
                this.textEditorService.textInput = this.defaultConfig
            } else if (!this.textEditorService.textInput) {
                this.textEditorService.textInput = PageTextEditorComponent.reverseParse(this.dataService.schemas, this.app.textEditorState)
            }

            this.Run()
            this.initialized = true
        }, 0)
    }

    Run() {
        /**
         *
         * Things we want to do NOW for rendering purposes
         *
         */
        this.textEditorService.justCleaned = false
        this.dataService.previousParse = PageTextEditorComponent.parse(this.textEditorService.textInput)
        this.textEditorService.doRender.next()

        if (this.dataService.schemas.length === 0) {
            this._run()
            return
        }
        clearTimeout(this.runDebounce)
        this.runDebounce = setTimeout(() => {
            this._run()
        }, 300)
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
        this.textEditorService.SaveLastTextEdit()
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
            if (!parsed['mode']) {
                parsed['mode'] = AppMode.YAML
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
