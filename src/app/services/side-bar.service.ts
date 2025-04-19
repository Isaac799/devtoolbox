import {AppGeneratorMode, CanvasSize, Schema, Table} from '../structure'
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

    debounce: ReturnType<typeof setTimeout> | undefined = undefined

    canvasSizeOptions: CanvasSize[] = [
        {
            name: 'small',
            x: 1920,
            y: 1080
        },
        {
            name: 'medium',
            x: 2560,
            y: 1440
        },
        {
            name: 'large',
            x: 3840,
            y: 2160
        },
        {
            name: 'a4',
            x: 2480,
            y: 3508
        },
        {
            name: 'a11',
            x: 2550,
            y: 3300
        }
    ]

    constructor() {
        for (let i = 0; i < this.generatorModeOptions.length; i++) {
            const e = this.generatorModeOptions[i]
            for (let k = 0; k < e.items.length; k++) {
                const r = e.items[k]
                if (r.value !== this.appService.app.generatorMode) {
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
        this.appService.app.generatorMode = c.value
        this.appService.RefreshOutput()
    }

    doShowModalTable(t?: Table) {
        const dialogRef = this.matDialog.open(DialogTableComponent, {
            data: {
                t,
                ss: this.data.schemas
            }
        })

        dialogRef.afterClosed().subscribe(() => {
            this.appService.RefreshOutput()
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
            this.appService.RefreshOutput()
        })
    }

    generatorModeSelectedIndex = [0, 0]
    generatorModeOptions: {title: string; icon?: string; items: {name: string; icon?: string; value: AppGeneratorMode}[]}[] = [
        {
            title: 'Postgres',
            icon: 'star',
            items: [
                {
                    name: 'Tables',
                    icon: 'star',
                    value: AppGeneratorMode.Postgres
                },
                // {
                //     name: 'Functions',
                //     value: AppGeneratorMode.PostgresFunctions
                // },
                {
                    name: 'Seed',
                    icon: 'star',
                    value: AppGeneratorMode.PostgresSeed
                }
            ]
        },
        // {
        //     title: 'MS SQL',
        //     items: [
        //         {
        //             name: 'Tables',
        //             value: AppGeneratorMode.TSQLTables
        //         }
        //         // {
        //         //     name: 'Procedures',
        //         //     value: AppGeneratorMode.TSQLStoredProcedures
        //         // }
        //     ]
        // },
        // {
        //     title: 'SQLite',
        //     items: [
        //         {
        //             name: 'Tables',
        //             value: AppGeneratorMode.SQLiteTables
        //         }
        //         // {
        //         //     name: 'Queries',
        //         //     value: AppGeneratorMode.SQLiteJoinQuery
        //         // }
        //     ]
        // },
        // {
        //     title: 'JS',
        //     items: [
        //         {
        //             name: 'Classes',
        //             value: AppGeneratorMode.JSClasses
        //         }
        //     ]
        // },
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
        // {
        //     title: 'C#',
        //     items: [
        //         {
        //             name: 'Classes',
        //             value: AppGeneratorMode.CSClasses
        //         }
        //     ]
        // },
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
            title: 'HTML',
            items: [
                {
                    name: 'Plain',
                    value: AppGeneratorMode.RawHTML
                },
                {
                    name: 'Plain (Bulma v1)',
                    value: AppGeneratorMode.RawBulma01HTML
                },
                {
                    name: 'Go Template',
                    value: AppGeneratorMode.GoTemplateHTML
                },
                {
                    name: 'Go Template (Bulma v1)',
                    value: AppGeneratorMode.GoTemplateBulma01HTML
                }
            ]
        }
        // {
        //     title: 'Rust',
        //     items: [
        //         {
        //             name: 'Structs & impl functions',
        //             value: AppGeneratorMode.RustStructAndImpl
        //         }
        //     ]
        // }
    ]
}
