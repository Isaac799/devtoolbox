import {inject, Injectable} from '@angular/core'
import {DataService} from './data.service'
import {TextEditorService} from './text-editor.service'
import {PageTextEditorComponent} from '../pages/page-text-editor/page-text-editor.component'
import {SchemaConfig} from '../structure'

@Injectable({
    providedIn: 'root'
})
export class AppService {
    dataService = inject(DataService)
    textEditorService = inject(TextEditorService)

    private initialized = false

    Initialize() {
        if (this.initialized) {
            return
        }
        this.initialized = true
        this.dataService.loadConfig()
        this.dataService.loadLastSession()
        this.textEditorService.loadLastTextEdit()
        if (!this.textEditorService.textInput) {
            this.textEditorService.textInput = PageTextEditorComponent.reverseParse(this.dataService.schemas, this.dataService.app.textEditorState)
        }
        setTimeout(() => {
            this.EmitChangesForApp()
        }, 0)
    }

    ReloadAndSave() {
        this.dataService.saveAppConfig()
        this.dataService.saveSchemasConfig()
        this.textEditorService.saveLastTextEdit()
        this.dataService.loadLastSession()
        this.EmitChangesForApp()
    }

    ReloadAndSaveFromConfig(config: Record<string, SchemaConfig>) {
        this.dataService.schemasConfig = config
        const s = JSON.stringify(this.dataService.schemasConfig, null, 2)
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
        this.dataService.schemasConfigChange.next(this.dataService.schemasConfig)
    }
}
