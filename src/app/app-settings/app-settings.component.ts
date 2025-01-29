import {Component, inject, OnInit} from '@angular/core'
import {CommonModule} from '@angular/common'
import {AppGeneratorMode, AppMode, Notification, NotificationKind, NotificationLife, Schema, Table} from '../structure'
import {FormsModule} from '@angular/forms'
import YAML from 'yaml'
import {NotificationService} from '../services/notification.service'
import {DataService} from '../services/data.service'
import {IsSeedModePipe} from '../pipes/is-seed-mode.pipe'
import {DialogSchemaComponent} from '../dialogs/dialog-schema/dialog-schema.component'
import {DialogTableComponent} from '../dialogs/dialog-table/dialog-table.component'
import {MatDialog} from '@angular/material/dialog'
import {MatButtonModule} from '@angular/material/button'
import {MatIconModule} from '@angular/material/icon';

@Component({
    standalone: true,
    selector: 'app-app-settings',
    imports: [CommonModule, FormsModule, IsSeedModePipe, MatButtonModule, MatIconModule],
    templateUrl: './app-settings.component.html',
    styleUrl: './app-settings.component.scss'
})
export class AppSettingsComponent implements OnInit {
    private matDialog = inject(MatDialog)

    debounce: ReturnType<typeof setTimeout> | undefined = undefined
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

    constructor(public data: DataService, private notification: NotificationService) {}

    ngOnInit(): void {
        for (let i = 0; i < this.generatorModeOptions.length; i++) {
            const e = this.generatorModeOptions[i]
            for (let k = 0; k < e.items.length; k++) {
                const r = e.items[k]
                if (r.value !== this.data.app.generatorMode) {
                    continue
                }
                this.generatorModeSelectedIndex = [i, k]
                break
            }
        }
    }

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

    debounceReload() {
        clearTimeout(this.debounce)
        this.debounce = setTimeout(() => {
            this.data.ReloadAndSave()
        }, 500)
    }

    copyConfig() {
        let str = ''
        if (this.data.app.mode === AppMode.JSON) {
            str = JSON.stringify(this.data.schemasConfig, null, 4)
        } else if (this.data.app.mode === AppMode.YAML) {
            str = YAML.stringify(this.data.schemasConfig)
        }
        navigator.clipboard.writeText(str)
        this.notification.Add(new Notification('Copied', 'The config was copied to your clipboard.', NotificationKind.Info, NotificationLife.Short))
    }

    doShowModalTable(t?: Table) {
        const dialogRef = this.matDialog.open(DialogTableComponent, {
            data: {
                t,
                ss: this.data.schemas
            }
        })

        dialogRef.afterClosed().subscribe(() => {
            this.data.ReloadAndSave()
        })
    }

    doShowModalSchema(s?: Schema) {
        const dialogRef = this.matDialog.open(DialogSchemaComponent, {
            data: {
                s,
                ss: this.data.schemas
            }
        })

        dialogRef.afterClosed().subscribe(() => {
            this.data.ReloadAndSave()
        })
    }

    generatorModeSelectedIndex = [0, 0]
    generatorModeOptions: {title: string; icon?: string; items: {name: string; icon?: string; value: AppGeneratorMode}[]}[] = [
        {
            title: 'PostgreSQL',
            icon: 'star',
            items: [
                {
                    name: 'Tables',
                    icon: 'star',
                    value: AppGeneratorMode.Postgres
                },
                {
                    name: 'Functions',
                    value: AppGeneratorMode.PostgresFunctions
                },
                {
                    name: ' Seed Data',
                    icon: 'star',
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
            title: 'HTTP Servers',
            icon: 'star',
            items: [
                {
                    name: 'Go & PostgreSQL',
                    icon: 'star',
                    value: AppGeneratorMode.APIGoPostgres
                }
            ]
        }
    ]
}
