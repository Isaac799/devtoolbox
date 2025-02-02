import {inject, Injectable} from '@angular/core'
import {DataService} from './data.service'
import {TextEditorService} from './text-editor.service'
import {PageTextEditorComponent} from '../pages/page-text-editor/page-text-editor.component'

@Injectable({
    providedIn: 'root'
})
export class AppService {
    dataService = inject(DataService)
    textEditorService = inject(TextEditorService)

    private initialized = false
    private readonly defaultConfig = `# library

## author
- id as ++
- first name as string with r, u:a, ..30
- last name as string with r, u:a, u:b, 4..30


## book
- id as ++
- title as string with r, u, ..50
- @author
`

    Initialize() {
        if (this.initialized) {
            return
        }
        this.initialized = true
        this.dataService.loadConfig()
        this.dataService.loadLastSession()
        this.textEditorService.loadLastTextEdit()

        setTimeout(() => {
            if (!this.dataService.schemas.length && !this.textEditorService.textInput) {
                this.textEditorService.textInput = this.defaultConfig
                this.textEditorService.rerun.next()
            } else if (!this.textEditorService.textInput) {
                this.textEditorService.textInput = PageTextEditorComponent.reverseParse(this.dataService.schemas, this.dataService.app.textEditorState)
                this.textEditorService.rerun.next()
            }

            this.ReloadAndSaveFromConfig()
        }, 0)
    }

    ReloadAndSave() {
        this.dataService.saveAppConfig()
        this.dataService.saveSchemasConfig()
        this.textEditorService.saveLastTextEdit()
        this.dataService.loadLastSession()
        this.EmitChangesForApp()
    }

    ReloadAndSaveFromConfig() {
        const s = JSON.stringify(this.dataService.previousParse, null, 2)
        if (s) {
            localStorage.setItem(this.dataService.stateSessionKey, s)
        }
        this.dataService.saveAppConfig()
        this.textEditorService.saveLastTextEdit()
        this.dataService.loadLastSession()

        this.EmitChangesForApp()
    }

    Reload() {
        this.dataService.loadLastSession()
    }

    EmitChangesForApp() {
        this.dataService.schemasChange.next(this.dataService.schemas)
    }
}
