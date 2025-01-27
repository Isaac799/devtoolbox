import {Component} from '@angular/core'
import {DataService} from '../services/data.service'
import {CommonModule} from '@angular/common'
import { AppGeneratorMode } from '../structure'

@Component({
    standalone: true,
    selector: 'app-app-settings',
    imports: [CommonModule],
    templateUrl: './app-settings.component.html',
    styleUrl: './app-settings.component.scss'
})
export class AppSettingsComponent {
    constructor(public data: DataService) {}


    
        setGenMode() {
            const c = this.generatorModeOptions[this.generatorModeSelectedIndex[0]].items[this.generatorModeSelectedIndex[1]]
            if (!c) {
                this.generatorModeSelectedIndex = [0, 0]
                this.setGenMode()
                return
            }
            this.data.app.generatorMode = c.value
            this.data.ReloadAndSave()
        }
        generatorModeSelectedIndex = [0, 0]
        generatorModeOptions = [
            {
                title: 'PostgreSQL',
                items: [
                    {
                        name: 'Tables',
                        value: AppGeneratorMode.Postgres
                    },
                    {
                        name: 'Functions',
                        value: AppGeneratorMode.PostgresFunctions
                    },
                    {
                        name: ' Seed Data',
                        value: AppGeneratorMode.PostgresSeed
                    }
                ]
            },
            {
                title: 'T-SQL',
                items: [
                    {
                        name: 'Tables',
                        value: AppGeneratorMode.TSQLTables
                    },
                    {
                        name: ' Stored Procedures',
                        value: AppGeneratorMode.TSQLStoredProcedures
                    }
                ]
            },
            {
                title: 'SQLite',
                items: [
                    {
                        name: 'Tables',
                        value: AppGeneratorMode.SQLiteTables
                    },
                    {
                        name: 'Queries',
                        value: AppGeneratorMode.SQLiteJoinQuery
                    }
                ]
            },
            {
                title: 'JavaScript',
                items: [
                    {
                        name: 'Classes (with JSDoc)',
                        value: AppGeneratorMode.JSClasses
                    }
                ]
            },
            {
                title: 'TypeScript',
                items: [
                    {
                        name: 'Classes',
                        value: AppGeneratorMode.TSClasses
                    },
                    {
                        name: 'Types & new ƒ',
                        value: AppGeneratorMode.TSTypesAndFns
                    }
                ]
            },
            {
                title: 'C#',
                items: [
                    {
                        name: 'Classes',
                        value: AppGeneratorMode.CSClasses
                    }
                ]
            },
            {
                title: 'Go',
                items: [
                    {
                        name: 'Structs & new ƒ',
                        value: AppGeneratorMode.GoStructsAndFns
                    }
                ]
            },
            {
                title: 'Rust',
                items: [
                    {
                        name: 'Rust: structs & impl ƒ',
                        value: AppGeneratorMode.RustStructAndImpl
                    }
                ]
            },
            {
                title: 'Angular',
                items: [
                    {
                        name: 'Reactive form',
                        value: AppGeneratorMode.AngularFormControl
                    }
                ]
            },
    
            {
                name: 'HTTP Servers',
                items: [
                    {
                        name: 'Go & PostgreSQL',
                        value: AppGeneratorMode.APIGoPostgres
                    }
                ]
            }
        ]
}
