import {AppGeneratorMode, AppMode, Schema, Table} from '../structure'
import YAML from 'yaml'
import {DataService} from '../services/data.service'
import {DialogSchemaComponent} from '../dialogs/dialog-schema/dialog-schema.component'
import {DialogTableComponent} from '../dialogs/dialog-table/dialog-table.component'
import {MatDialog} from '@angular/material/dialog'
import {inject, Injectable} from '@angular/core'
import {MatSnackBar} from '@angular/material/snack-bar'
import {AppService} from './app.service'

@Injectable({
    providedIn: 'root'
})
export class SideBarService {
    private matDialog = inject(MatDialog)
    private data = inject(DataService)
    private readonly snackBar = inject(MatSnackBar)
    private readonly appService = inject(AppService)

    showMoreDetails = false

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

    constructor() {
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
        this.appService.ReloadAndSave()
    }

    debounceReload() {
        clearTimeout(this.debounce)
        this.debounce = setTimeout(() => {
            this.appService.ReloadAndSave()
        }, 300)
    }

    copyConfig() {
        let str = ''
        if (!this.data.previousParse) {
            return
        }
        if (this.data.app.mode === AppMode.JSON) {
            str = JSON.stringify(this.data.previousParse.data, null, 4)
        } else if (this.data.app.mode === AppMode.YAML) {
            str = YAML.stringify(this.data.previousParse.data)
        }
        navigator.clipboard.writeText(str)
        this.snackBar.open('Copied config to the clipboard', '', {
            duration: 2500
        })
    }

    doShowModalTable(t?: Table) {
        const dialogRef = this.matDialog.open(DialogTableComponent, {
            data: {
                t,
                ss: this.data.schemas
            }
        })

        dialogRef.afterClosed().subscribe(() => {
            this.appService.ReloadAndSave()
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
            this.appService.ReloadAndSave()
        })
    }

    generatorModeSelectedIndex = [0, 0]
    generatorModeOptions: {title: string; icon?: string; items: {name: string; icon?: string; value: AppGeneratorMode}[]}[] = [
        {
            title: 'PSQL',
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
                    name: 'Seed',
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
                    name: 'Procedures',
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
            title: 'JS',
            items: [
                {
                    name: 'Classes',
                    value: AppGeneratorMode.JSClasses
                }
            ]
        },
        {
            title: 'TS',
            items: [
                {
                    name: 'Classes',
                    value: AppGeneratorMode.TSClasses
                },
                {
                    name: 'Types & new functions',
                    value: AppGeneratorMode.TSTypesAndFns
                },
                {
                    name: 'Angular reactive form',
                    value: AppGeneratorMode.AngularFormControl
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
                    name: 'Structs & new functions',
                    value: AppGeneratorMode.GoStructsAndFns
                },

                {
                    name: 'HTTP handlers using PostgreSQL',
                    icon: 'star',
                    value: AppGeneratorMode.APIGoPostgres
                }
            ]
        },
        {
            title: 'Rust',
            items: [
                {
                    name: 'structs & impl functions',
                    value: AppGeneratorMode.RustStructAndImpl
                }
            ]
        }
    ]
}
