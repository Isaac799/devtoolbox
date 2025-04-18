import {CommonModule} from '@angular/common'
import {AfterViewInit, Component, ElementRef, inject, ViewChild} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {PageTextEditorComponent} from '../page-text-editor/page-text-editor.component'
import {NewAttrConstraint, PG_TO_PG_TYPE, SchemaConfig} from '../../structure'
import {LanguagePsqlService} from '../../services/language/language-psql.service'
import {DataService} from '../../services/data.service'
import {alignKeyword, cc} from '../../formatting'
import hljs from 'highlight.js'
import {LanguageSqlService} from '../../services/language/language-sql.service'
import {MatToolbarModule} from '@angular/material/toolbar'
import {MatButtonModule} from '@angular/material/button'
import {MatIconModule} from '@angular/material/icon'
import {MatSnackBar} from '@angular/material/snack-bar'
import {MatDialog} from '@angular/material/dialog'
import {MatTooltipModule} from '@angular/material/tooltip'
import {MatChipsModule} from '@angular/material/chips'
import { DialogConfirmComponent } from '../../dialogs/dialog-confirm/dialog-confirm.component'

interface Example {
    title: string
    desc: string
    to: string
    from: string
}

@Component({
    standalone: true,
    selector: 'app-page-migration',
    imports: [CommonModule, FormsModule, MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule, MatChipsModule],
    templateUrl: './page-migration.component.html',
    styleUrl: './page-migration.component.scss'
})
export class PageMigrationComponent implements AfterViewInit {
    private readonly snackBar = inject(MatSnackBar)
    readonly dialog = inject(MatDialog)
    private output = ''

    @ViewChild('fromEl') fromEl?: ElementRef<HTMLTextAreaElement>
    @ViewChild('toEl') toEl?: ElementRef<HTMLTextAreaElement>
    @ViewChild('outputEl') outputEl?: ElementRef<HTMLTextAreaElement>

    examples: Example[] = [
        {
            title: `S T A`,
            desc: 'Demonstrates creating a schema, table, and attribute',
            from: `# Bar

## Product
- id as auto increment
- name as string with ..10`,
            to: `# Foo

## Category
- id as auto increment
- name as string with ..10

# Bar

## Product
- id as auto increment
- name as string with ..10
- price as money with required, ..99

## Category Product
- @category with primary
- @product with primary`
        },
        {
            title: `PK`,
            desc: 'Highlights primary key changes',
            from: `# Bar

## Product
- material as int with primary`,
            to: `# Bar

## Product
- material as int with primary
- lot as int with primary`
        },
        {
            title: `FK`,
            desc: 'Highlights foreign key changes',
            from: `# Foo

## Category
- id as auto increment

# Bar

## Product
- id as auto increment
- @category`,
            to: `# Foo

## Category
- id as auto increment

# Bar

## Product
- id as auto increment
- predecessor as product

## Category Product
- @category with primary
- @product with primary`
        },
        {
            title: `Unique`,
            desc: 'Highlights unique constraint changes',
            from: `# Foo

## Person
- first name as string with ..15, unique:a
- last name as string with ..15, unique:b
- birthday as date`,
            to: `# Foo

## Person
- first name as string with ..15, unique:a
- last name as string with ..15, unique:a
- birthday as date with unique:b`
        },
        {
            title: `Type`,
            desc: 'Highlights attribute type changes',
            from: `# Foo

## Person
- name as string with ..15
- active as boolean`,
            to: `# Foo

## Person
- name as string with ..30
- active as char`
        },
        {
            title: `Null`,
            desc: 'Highlights nullability constraint changes',
            from: `# Foo

## Person
- age as int with required`,
            to: `# Foo

## Person
- age as int`
        }
        // {
        //     title: ``,
        //     from: ``,
        //     to: ``
        // }
    ]

    from: {
        parsed: Record<string, SchemaConfig>
        raw: string
    } = {
        parsed: {},
        raw: ``
    }

    to: {
        parsed: Record<string, SchemaConfig>
        raw: string
    } = {
        parsed: {},
        raw: ``
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.Run()
        }, 0)
    }

    UseExample(e: Example) {
        // this.dialog.open(DialogConfirmComponent, {
        //     data: {
        //         message: 'Using an example will replace the existing code, this cannot be undone. Are you sure?',
        //         accept: () => {
        // this.from.raw = e.from
        // this.to.raw = e.to
        // this.Run()
        //         }
        //     }
        // })
        this.from.raw = e.from
        this.to.raw = e.to
        this.Run()
    }

    Swap() {
        const a = this.from.raw
        const b = this.to.raw
        this.from.raw = b
        this.to.raw = a
        this.Run()
    }

    Copy() {
        navigator.clipboard.writeText(this.output)
        this.snackBar.open('Copied to clipboard', '', {
            duration: 2500
        })
    }

    Run() {
        this.parse()
        this.output = PageMigrationComponent.compare(this.from.parsed, this.to.parsed)
        const code = hljs.highlight(this.output, {language: 'sql'}).value
        if (!this.outputEl) {
            console.error('missing output element')
            return
        }
        this.outputEl.nativeElement.innerHTML = code
    }

    private parse() {
        const toParse = PageTextEditorComponent.parse(this.to.raw)
        if (typeof toParse === 'string') {
            this.cannotIncludeMacros()
            return
        }

        const fromParse = PageTextEditorComponent.parse(this.from.raw)
        if (typeof fromParse === 'string') {
            this.cannotIncludeMacros()
            return
        }

        this.to.parsed = toParse.data
        this.from.parsed = fromParse.data
    }

    static compare(before: Record<string, SchemaConfig>, after: Record<string, SchemaConfig>): string {
        let script: string[] = []

        const replaceAlign = `~~!~~`
        const replaceAlign2 = `~~!!~~`

        const beforeParsed = DataService.ParseSchemaConfig(before)
        const afterParsed = DataService.ParseSchemaConfig(after)

        const renamed: string[] = []

        // ALTER TABLE table_name RENAME COLUMN old_name TO new_name;

        script.push('-- modify existing: alter and drop attributes\n')

        // Only Updated and Deleted
        for (const s1 of beforeParsed) {
            let foundSchema = false
            for (const s2 of afterParsed) {
                if (s1.Name !== s2.Name) continue
                foundSchema = true
                //
                for (const t1 of s1.Tables) {
                    let foundTable = false
                    for (const t2 of s2.Tables) {
                        if (t1.Name !== t2.Name) continue
                        foundTable = true
                        const alterT = `ALTER TABLE ${t1.FN}`
                        //
                        for (const a1 of t1.Attributes) {
                            let foundAttribute = false
                            for (const a2 of t2.Attributes) {
                                if (a1.Name !== a2.Name) continue
                                foundAttribute = true
                                const alterA = `ALTER TABLE ${t1.FN} ${replaceAlign}ALTER COLUMN${replaceAlign2} ${cc(a1.Name, 'sk')}`
                                // Type
                                const typeChanged = a1.Type !== a2.Type
                                if (typeChanged) {
                                    if (a2.isStr()) {
                                        const s = `${alterA} TYPE ${a2.VarcharType()};`
                                        script.push(s)
                                    } else {
                                        const s = `${alterA} TYPE ${PG_TO_PG_TYPE[a2.Type]};`
                                        script.push(s)
                                    }
                                }

                                // Options
                                if (a1.Option?.Default !== a2.Option?.Default) {
                                    if (!a1.Option?.Default && a2.Option?.Default !== undefined) {
                                        // add
                                        let s = ''
                                        if (a1.isStr()) {
                                            s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} '${a2.Option?.Default}';`
                                        } else {
                                            s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} ${a2.Option?.Default};`
                                        }
                                        script.push(s)
                                    } else if (!a2.Option?.Default) {
                                        // remove
                                        const s = `${alterA} DROP DEFAULT;`
                                        script.push(s)
                                    } else {
                                        // update
                                        let s = ''
                                        if (a1.isStr()) {
                                            s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} '${a2.Option?.Default}';`
                                        } else {
                                            s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} ${a2.Option?.Default};`
                                        }
                                        script.push(s)
                                    }
                                }
                                if (a1.Option?.PrimaryKey !== a2.Option?.PrimaryKey) {
                                    if (!a1.Option?.PrimaryKey) {
                                        // add
                                        const s = `${alterT} ${replaceAlign}ADD PRIMARY KEY${replaceAlign2} ${cc(a2.Name, 'sk')};`
                                        script.push(s)
                                    } else {
                                        // remove
                                        const s = `${alterT} ${replaceAlign}DROP CONSTRAINT${replaceAlign2} ${t2.Constraint('Primary Key')};`
                                        script.push(s)
                                    }
                                }
                                if (a1.Option?.SystemField !== a2.Option?.SystemField) {
                                    if (!a1.Option?.PrimaryKey) {
                                        // add
                                    } else {
                                        // remove
                                    }
                                }
                                // Validation
                                if (a1.Validation?.Required !== a2.Validation?.Required) {
                                    if (!a1.Validation?.Required) {
                                        // add
                                        const s = `${alterA} SET NOT NULL;`
                                        script.push(s)
                                    } else {
                                        // remove
                                        const s = `${alterA} DROP NOT NULL;`
                                        script.push(s)
                                    }
                                }
                                if (a1.Validation?.Min !== a2.Validation?.Min) {
                                    if (!a1.Validation?.Min) {
                                        // add
                                    } else if (!a2.Validation?.Min) {
                                        // remove
                                    } else {
                                        // update
                                    }
                                }
                                maxChange: if (a1.Validation?.Max !== a2.Validation?.Max) {
                                    if (!a1.Validation?.Max) {
                                        // add
                                    } else if (!a2.Validation?.Max) {
                                        // remove
                                    } else {
                                        // update
                                        if (!a2.isStr()) break maxChange
                                        if (typeChanged) {
                                            break maxChange
                                        } else {
                                            if (a1.isStr()) {
                                                const s = `${alterA} TYPE ${a2.VarcharType()};`
                                                script.push(s)
                                            } else {
                                                const s = `${alterA} TYPE ${PG_TO_PG_TYPE[a2.Type]};`
                                                script.push(s)
                                            }
                                        }
                                    }
                                }
                            }
                            if (foundAttribute) {
                                continue
                            }
                            const s = `${alterT} ${replaceAlign}DROP COLUMN${replaceAlign2} ${cc(a1.Name, 'sk')};`
                            script.push(s)
                        }

                        //#region uniques

                        const beforeUniques = LanguageSqlService.DiscoverUniqueAttributes(t1)
                        const afterUniques = LanguageSqlService.DiscoverUniqueAttributes(t2)

                        const uniqueDrops = []
                        const uniqueAdds = []

                        for (const [beforeLabel, beforeAttrs] of Object.entries(beforeUniques)) {
                            let found = false
                            let contentSame = false
                            for (const [afterLabel, afterAttrs] of Object.entries(afterUniques)) {
                                if (beforeLabel !== afterLabel) continue
                                // same label
                                found = true

                                // TODO test more

                                // check same content
                                // same: skip || diff: drop before, add after

                                const beforeContent = JSON.stringify(beforeAttrs.map(e => e.FN))
                                const afterContent = JSON.stringify(afterAttrs.map(e => e.FN))

                                contentSame = beforeContent === afterContent
                                if (contentSame) continue
                                {
                                    const attrNames = afterAttrs.map(e => cc(e.Name, 'sk')).join(', ')
                                    const uniquesStr = `UNIQUE ( ${attrNames} )`
                                    const s = `${alterT} ${replaceAlign}ADD CONSTRAINT${replaceAlign2} ${NewAttrConstraint(
                                        'Unique',
                                        afterAttrs
                                    )} ${uniquesStr};`
                                    uniqueAdds.push(s)
                                }
                            }
                            if (found && contentSame) continue
                            // drop before, not found in after
                            const s = `${alterT} ${replaceAlign}DROP CONSTRAINT${replaceAlign2} ${NewAttrConstraint('Unique', beforeAttrs)};`
                            uniqueDrops.push(s)
                        }

                        script = script.concat(uniqueDrops)
                        script = script.concat(uniqueAdds)
                        //#endregion
                    }
                    if (foundTable) {
                        continue
                    }
                    const s = `DROP TABLE ${t1.FN} CASCADE;`
                    script.push(s)
                }
            }
            if (foundSchema) {
                continue
            }
            const s = `DROP SCHEMA ${cc(s1.Name, 'sk')} CASCADE;`
            script.push(s)
        }

        script.push('\n-- create new schemas \n')

        // Only New Schemas
        for (const s2 of afterParsed) {
            let foundSchema = false
            for (const s1 of beforeParsed) {
                if (s1.Name !== s2.Name) continue
                foundSchema = true
            }
            if (foundSchema) continue
            console.log(s2.Name)
            const s = LanguagePsqlService.ToTables([s2], true)
            script.push(s.trim())
        }

        script.push('\n-- create tables in existing schemas\n')

        // Only New Tables
        for (const s2 of afterParsed) {
            for (const s1 of beforeParsed) {
                if (s1.Name !== s2.Name) continue
                //
                for (const t2 of s2.Tables) {
                    let foundTable = false
                    for (const t1 of s1.Tables) {
                        if (t1.Name !== t2.Name) continue
                        foundTable = true
                        break
                    }
                    if (foundTable) continue
                    const newTblLines = LanguagePsqlService.GenerateTable(false, t2)
                    script = script.concat(newTblLines)
                }
            }
        }

        script.push('\n-- alter and add attributes to (now) existing tables\n')

        // Only New Attributes
        for (const s2 of afterParsed) {
            for (const s1 of beforeParsed) {
                if (s1.Name !== s2.Name) continue
                //
                for (const t2 of s2.Tables) {
                    let addedCol = false
                    const alterT = `ALTER TABLE ${t2.FN}`

                    for (const t1 of s1.Tables) {
                        if (t1.Name !== t2.Name) continue

                        //
                        for (const a2 of t2.Attributes) {
                            let foundAttribute = false
                            for (const a1 of t1.Attributes) {
                                if (a1.Name !== a2.Name) continue
                                foundAttribute = true
                                // const alterA = `ALTER TABLE ${t1.FN} ${replaceAlign}ALTER COLUMN ${cc(a1.Name, 'sk')}`
                            }
                            if (foundAttribute) continue

                            const alterA = `ALTER TABLE ${t1.FN} ${replaceAlign}ALTER COLUMN${replaceAlign2} ${cc(a2.Name, 'sk')}`

                            if (a2.RefTo) {
                                const allAttrs = t2.AllAttributes()
                                for (const key in allAttrs) {
                                    if (!Object.prototype.hasOwnProperty.call(allAttrs, key)) {
                                        continue
                                    }
                                    const [srcA, a] = allAttrs[key]
                                    if (!srcA || (srcA && srcA?.Parent.ID !== t2.ID)) continue

                                    const parts = [
                                        `${alterT} ${replaceAlign}ADD COLUMN${replaceAlign2} ${key} REFERENCES ${a.Parent.FN} ( ${cc(a.Name, 'sk')} )`
                                    ]

                                    if (a2.Validation?.Required) {
                                        parts.push('NOT NULL')
                                    }
                                    if (a2.Option?.Default) {
                                        let s = ''
                                        if (a2.isStr()) {
                                            s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} '${a2.Option?.Default}';`
                                        } else {
                                            s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} ${a2.Option?.Default};`
                                        }
                                        parts.push(s)
                                    }

                                    const s = parts.join(' ') + ';'
                                    script.push(s)
                                }
                            } else {
                                const s = `${alterT} ${replaceAlign}ADD COLUMN${replaceAlign2} ${LanguagePsqlService.generateAttrLine(cc(a2.Name, 'sk'), a2)};`
                                script.push(s)
                            }
                            addedCol = true
                        }

                        const beforePks = t1.AllPrimaryDeterminedIdentifiers()
                        const afterPks = t2.AllPrimaryDeterminedIdentifiers()

                        const pkChanged = JSON.stringify(beforePks) !== JSON.stringify(afterPks)

                        if (pkChanged) {
                            {
                                const constraint = t1.Constraint('Primary Key')
                                const s = `${alterT} ${replaceAlign}DROP CONSTRAINT${replaceAlign2} ${constraint};`
                                script.push(s)
                            }

                            if (afterPks.length > 0) {
                                // const newPK = NewTableConstraint('Primary Key', t2)
                                const newPkLabels = afterPks.join(', ')
                                const s = `${alterT} ${replaceAlign}ADD PRIMARY KEY${replaceAlign2} ( ${newPkLabels} );`
                                script.push(s)
                            }
                        }
                        if (!addedCol) continue

                        //#region uniques
                        const beforeUniques = LanguageSqlService.DiscoverUniqueAttributes(t1)
                        const afterUniques = LanguageSqlService.DiscoverUniqueAttributes(t2)

                        for (const [afterLabel, afterAttrs] of Object.entries(afterUniques)) {
                            let found = false
                            for (const [beforeLabel, beforeAttrs] of Object.entries(beforeUniques)) {
                                if (beforeLabel !== afterLabel) continue
                                // same label
                                found = true
                            }
                            if (found) continue
                            {
                                const attrNames = afterAttrs.map(e => cc(e.Name, 'sk')).join(', ')
                                const uniquesStr = `UNIQUE ( ${attrNames} )`
                                const s = `${alterT} ${replaceAlign}ADD  CONSTRAINT${replaceAlign2} ${NewAttrConstraint('Unique', afterAttrs)} ${uniquesStr};`
                                script.push(s)
                            }
                        }
                        //#endregion
                    }
                }
            }
        }

        script = alignKeyword(script, replaceAlign)
        script = script.map(e => e.replace(replaceAlign, ''))
        script = alignKeyword(script, replaceAlign2)
        script = script.map(e => e.replace(replaceAlign2, ''))
        return script.join('\n').trim()
    }

    cannotIncludeMacros() {
        // this.output = 'to-from cannot include macros'
    }
}
