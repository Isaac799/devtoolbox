import {Component, OnInit} from '@angular/core'
import {
    AppComplexityMode,
    AppGeneratorMode,
    AppMode,
    NotificationKind,
    NotificationLife
} from './structure'
import {CommonModule} from '@angular/common'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {GuiEditorComponent} from './gui-editor/gui-editor.component'
import {DataService} from './services/data.service'
import {ModalComponent} from './modal/modal.component'
import {CodeOutputComponent} from './code-output/code-output.component'
import {NotificationService} from './services/notification.service'
import YAML from 'yaml'
import {Notification} from './structure'

@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        GuiEditorComponent,
        ModalComponent,
        CodeOutputComponent
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
    readonly title = 'devtoolbox'
    showSettingsModal = false

    modeOptions = [
        {
            name: 'JSON',
            value: AppMode.JSON
        },
        {
            name: 'YAML',
            value: AppMode.YAML
        }
    ]

    complexityOptions = [
        {
            name: 'Easy Mode',
            value: AppComplexityMode.Simple
        },
        {
            name: 'Advanced Mode',
            value: AppComplexityMode.Advanced
        }
    ]

    generatorModeOptions = [
        {
            name: 'Postgres: Tables',
            value: AppGeneratorMode.Postgres
        },
        {
            name: 'Postgres: ƒ',
            value: AppGeneratorMode.PostgresFunctions
        },
        {
            name: 'T-SQL: tables',
            value: AppGeneratorMode.TSQLTables
        },
        {
            name: ' T-SQL: procedures',
            value: AppGeneratorMode.TSQLStoredProcedures
        },
        {
            name: 'SQLite: tables',
            value: AppGeneratorMode.SQLiteTables
        },
        {
            name: 'SQLite: queries',
            value: AppGeneratorMode.SQLiteJoinQuery
        },
        {
            name: 'JavaScript: classes',
            value: AppGeneratorMode.JSClasses
        },
        {
            name: 'TypeScript: classes',
            value: AppGeneratorMode.TSClasses
        },
        {
            name: 'TypeScript: types & ƒ',
            value: AppGeneratorMode.TSTypesAndFns
        },
        {
            name: 'Go: structs & ƒ',
            value: AppGeneratorMode.GoStructsAndFns
        },
        {
            name: 'Rust: structs & impl ƒ',
            value: AppGeneratorMode.RustStructAndImpl
        },
        {
            name: 'Angular: reactive form',
            value: AppGeneratorMode.AngularFormControl
        }
    ]

    constructor(
        public data: DataService,
        public notification: NotificationService
    ) {}

    ngOnInit(): void {
        this.data.Initialize()
    }

    copyConfig() {
        let str = ''
        if (this.data.app.mode === AppMode.JSON) {
            str = JSON.stringify(this.data.schemasConfig, null, 4)
        } else if (this.data.app.mode === AppMode.YAML) {
            str = YAML.stringify(this.data.schemasConfig)
        }
        navigator.clipboard.writeText(str)
        this.notification.Add(
            new Notification(
                'Copied',
                'The config was copied to your clipboard.',
                NotificationKind.Info,
                NotificationLife.Short
            )
        )
    }
}
