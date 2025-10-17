import {CommonModule} from '@angular/common'
import {AfterViewInit, Component, ElementRef, inject, ViewChild} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {PageTextEditorComponent} from '../page-text-editor/page-text-editor.component'
import {Attribute, AttrType, NewAttrConstraint, PG_TO_PG_TYPE, Schema, SchemaConfig, Table} from '../../structure'
import {LanguagePsqlService} from '../../services/language/language-psql.service'
import {DataService} from '../../services/data.service'
import {alignKeyword, cc} from '../../formatting'
import hljs from 'highlight.js'
import {InformService} from '../../services/inform.service'

const replaceAlign = `~~!~~`
const replaceAlign2 = `~~!!~~`

interface Example {
    title: string
    desc: string
    to: string
    from: string
}

@Component({
    standalone: true,
    selector: 'app-page-migration',
    imports: [CommonModule, FormsModule],
    templateUrl: './page-migration.component.html',
    styleUrl: './page-migration.component.scss'
})
export class PageMigrationComponent implements AfterViewInit {
    private output = ''

    readonly inform = inject(InformService)

    @ViewChild('fromEl') fromEl?: ElementRef<HTMLTextAreaElement>
    @ViewChild('toEl') toEl?: ElementRef<HTMLTextAreaElement>
    @ViewChild('outputEl') outputEl?: ElementRef<HTMLTextAreaElement>

    selectedExample?: Example
    examples: Example[] = [
        {
            title: `Nullability`,
            desc: 'Highlights nullability constraint changes',
            from: `# Foo

## Person
- age as int with required`,
            to: `# Foo

## Person
- age as int`
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
            title: `Parent`,
            desc: 'Highlights foreign key changes',
            from: `
# Foo

## Person
- id as auto increment`,
            to: `
# Foo

## Person
- id as auto increment
- parent as Person`
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
            title: `Composite PK`,
            desc: 'Highlights composite primary key changes',
            from: `# Bar

## Product
- material as int with primary`,
            to: `# Bar

## Product
- material as int with primary
- lot as int with primary`
        },
        {
            title: `Associative`,
            desc: 'Highlights foreign key changes with an associative entity',
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

## Category Product
- @category with primary
- @product with primary`
        },
        {
            title: `Foreign Change`,
            desc: 'Shows how an existing reference can be changed.',
            from: `# Foo

## Category
- id as auto increment
- id 2 as auto increment
- name as string with ..10

# Bar

## Product
- id as auto increment
- name as string with ..10
- @category
`,
            to: `# Foo

## Category
- id as auto increment
- name as string with ..10

# Bar

## Product
- id as auto increment
- name as string with ..10
- @category
`
            // - id 2 as auto increment
            // - @category with primary
        },
        {
            title: `Int to FK`,
            desc: 'Shows how a column can evolve into a reference.',
            from: `# Bar

## Product
- id as auto increment
- name as string with ..10
- category as int`,
            to: `# Foo

## Category
- id as auto increment
- name as string with ..10

# Bar

## Product
- id as auto increment
- name as string with ..10
- @category
`
            // - id 2 as auto increment
            // - @category with primary
        },
        {
            title: `Schema, Table, Attr`,
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
        }
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

        const to = this.toEl
        const from = this.fromEl

        if (!to || !from) return
    }

    UseExample() {
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
        if (!this.selectedExample) {
            return
        }
        this.from.raw = this.selectedExample.from
        this.to.raw = this.selectedExample.to
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
        this.inform.Mention('Copied to clipboard')
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

        const beforeParsed = DataService.ParseSchemaConfig(before)
        const afterParsed = DataService.ParseSchemaConfig(after)

        const renamed: string[] = []

        // ALTER TABLE table_name RENAME COLUMN old_name TO new_name;

        script.push('-- alter and drop attributes\n')

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

                        script = handleUpdatedAndDeletedAttrs(t1, t2, alterT, script)
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

        script = PageMigrationComponent.cleanScript(script)

        script.push('\n-- create new schemas \n')

        // Only New Schemas
        for (const s2 of afterParsed) {
            let foundSchema = false
            for (const s1 of beforeParsed) {
                if (s1.Name !== s2.Name) continue
                foundSchema = true
            }
            if (foundSchema) continue
            const s = LanguagePsqlService.ToTables([s2], true)
            script.push(s.trim())
        }

        script = PageMigrationComponent.cleanScript(script)

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

        script = PageMigrationComponent.cleanScript(script)

        script.push('\n-- alter and add attributes\n')

        // Only New Attributes
        for (const s2 of afterParsed) {
            for (const s1 of beforeParsed) {
                if (s1.Name !== s2.Name) continue
                //
                for (const t2 of s2.Tables) {
                    handleNewAttributes(t2, s1, script)
                }
            }
        }

        script = PageMigrationComponent.cleanScript(script)

        script = alignKeyword(script, replaceAlign)
        script = script.map(e => e.replace(replaceAlign, ''))
        script = alignKeyword(script, replaceAlign2)
        script = script.map(e => e.replace(replaceAlign2, ''))

        script.unshift('')
        script.unshift('-- notice: statements may be out of order')

        return script.join('\n').trim()
    }

    private static cleanScript(script: string[]) {
        const temp = [...script].filter(e => e.trim().length > 0)
        if (temp.length > 0 && temp[temp.length - 1].trim().startsWith('--')) {
            temp.pop()
        }
        return temp
    }

    cannotIncludeMacros() {
        // this.output = 'to-from cannot include macros'
    }
}

function handleNewAttributes(afterTable: Table, beforeSchema: Schema, script: string[]) {
    const alterT = `ALTER TABLE ${afterTable.FN}`
    let addedCol = false
    for (const t1 of beforeSchema.Tables) {
        if (t1.Name !== afterTable.Name) continue

        //
        for (const a2 of afterTable.Attributes) {
            let foundAttribute = false
            for (const a1 of t1.Attributes) {
                if (a1.Name !== a2.Name) continue
                foundAttribute = true
                // const alterA = `ALTER TABLE ${t1.FN} ${replaceAlign}ALTER COLUMN ${cc(a1.Name, 'sk')}`
            }
            // console.log(afterTable)
            if (foundAttribute) continue

            const alterA = `ALTER TABLE ${t1.FN} ${replaceAlign}ALTER COLUMN${replaceAlign2} ${cc(a2.Name, 'sk')}`

            if (a2.RefTo) {
                addReferenceColumn(afterTable, alterT, a2, alterA, script)
            } else {
                const s = `${alterT} ${replaceAlign}ADD COLUMN${replaceAlign2} ${LanguagePsqlService.generateAttrLine(cc(a2.Name, 'sk'), a2)};`
                script.push(s)
            }
            addedCol = true
        }

        const beforePks = t1.AllPrimaryDeterminedIdentifiers()
        const afterPks = afterTable.AllPrimaryDeterminedIdentifiers()
        const pkChanged = JSON.stringify(beforePks) !== JSON.stringify(afterPks)

        if (pkChanged) {
            // {
            //     const constraint = t1.Constraint('Primary Key')
            //     const s = `${alterT} ${replaceAlign}DROP CONSTRAINT${replaceAlign2} ${constraint};`
            //     script.push(s)
            // }

            if (afterPks.length > 0) {
                // const newPK = NewTableConstraint('Primary Key', t2)
                const newPkLabels = afterPks.join(', ')
                const s = `${alterT} ${replaceAlign}ADD PRIMARY KEY${replaceAlign2} ( ${newPkLabels} );`
                script.push(s)
            }
        }

        if (!addedCol) continue

        //#region uniques
        const beforeUniques = t1.DetermineUniqueAttributes()
        const afterUniques = afterTable.DetermineUniqueAttributes()

        for (const [afterLabel, afterAttrs] of Object.entries(afterUniques)) {
            let found = false
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [beforeLabel, beforeAttrs] of Object.entries(beforeUniques)) {
                if (beforeLabel !== afterLabel) continue
                // same label
                found = true
            }
            if (found) continue
            {
                const attrNames = afterAttrs.map(e => cc(e[0], 'sk')).join(', ')
                const uniquesStr = `UNIQUE ( ${attrNames} )`
                const s = `${alterT} ${replaceAlign}ADD  CONSTRAINT${replaceAlign2} ${NewAttrConstraint(
                    'Unique',
                    afterAttrs.map(e => e[1][1]) /* TODO ?? */
                )} ${uniquesStr};`
                script.push(s)
            }
        }
        //#endregion
    }
    return addedCol
}

function addReferenceColumn(afterTable: Table, alterT: string, afterAttr: Attribute, alterA: string, script: string[]) {
    const allAttrs = afterTable.AllAttributes()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [determinedKey, [calledFrom, a, isPk, isFk, validation, options]] of Object.entries(allAttrs)) {
        const srcA = calledFrom[calledFrom.length - 1]
        if (!srcA || (srcA && srcA?.Parent.ID !== afterTable.ID)) continue

        const parts = [`${alterT} ${replaceAlign}ADD COLUMN${replaceAlign2} ${determinedKey} REFERENCES ${a.Parent.FN} ( ${cc(a.Name, 'sk')} )`]

        if (afterAttr.Validation?.Required) {
            parts.push('NOT NULL')
        }
        if (afterAttr.Option?.Default) {
            let s = ''
            if (afterAttr.isStr()) {
                s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} '${afterAttr.Option?.Default}';`
            } else {
                s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} ${afterAttr.Option?.Default};`
            }
            parts.push(s)
        }

        const s = parts.join(' ') + ';'
        script.push(s)
    }
}

function handleUpdatedAndDeletedAttrs(beforeT: Table, afterT: Table, alterT: string, script: string[]) {
    const beforePks = beforeT.AllPrimaryDeterminedIdentifiers()
    const afterPks = afterT.AllPrimaryDeterminedIdentifiers()
    const pkChanged = JSON.stringify(beforePks) !== JSON.stringify(afterPks)
    if (pkChanged) {
        const constraint = beforeT.Constraint('Primary Key')
        const s = `${alterT} ${replaceAlign}DROP CONSTRAINT${replaceAlign2} ${constraint};`
        script.push(s)
    }

    //
    for (const a1 of beforeT.Attributes) {
        let foundAttribute = false
        for (const a2 of afterT.Attributes) {
            if (a1.Name !== a2.Name) continue
            foundAttribute = true
            handleUpdateDeleteAttr(beforeT, a1, a2, alterT, script)
        }
        if (foundAttribute) {
            continue
        }
        const s = `${alterT} ${replaceAlign}DROP COLUMN${replaceAlign2} ${cc(a1.Name, 'sk')};`
        script.push(s)
    }

    //#region uniques
    const beforeUniques = beforeT.DetermineUniqueAttributes()
    const afterUniques = afterT.DetermineUniqueAttributes()

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
            const beforeContent = JSON.stringify(beforeAttrs.map(e => e[0]))
            const afterContent = JSON.stringify(afterAttrs.map(e => e[0]))

            contentSame = beforeContent === afterContent
            if (contentSame) continue
            {
                const attrNames = afterAttrs.map(e => e[0]).join(', ')
                const uniquesStr = `UNIQUE ( ${attrNames} )`
                const s = `${alterT} ${replaceAlign}ADD CONSTRAINT${replaceAlign2} ${NewAttrConstraint(
                    'Unique',
                    afterAttrs.map(e => e[1][1]) // TODO ??
                )} ${uniquesStr};`
                uniqueAdds.push(s)
            }
        }
        if (found && contentSame) continue
        // drop before, not found in after
        const s = `${alterT} ${replaceAlign}DROP CONSTRAINT${replaceAlign2} ${NewAttrConstraint(
            'Unique',
            beforeAttrs.map(e => e[1][1]) /* TODO ?? */
        )};`
        uniqueDrops.push(s)
    }

    script = script.concat(uniqueDrops)
    script = script.concat(uniqueAdds)
    return script
}

function handleUpdateDeleteAttr(beforeTable: Table, beforeAttr: Attribute, afterAttr: Attribute, alterT: string, script: string[]) {
    const alterA = `ALTER TABLE ${beforeTable.FN} ${replaceAlign}ALTER COLUMN${replaceAlign2} ${cc(beforeAttr.Name, 'sk')}`
    // Type
    const afterT = afterAttr.Type === AttrType.SERIAL ? AttrType.INT : afterAttr.Type

    const typeChanged = beforeAttr.Type !== afterT
    if (typeChanged) {
        if (afterAttr.isStr() && afterAttr.Type !== AttrType.REFERENCE) {
            const s = `${alterA} TYPE ${afterAttr.VarcharType()};`
            script.push(s)
        } else {
            if (afterAttr.Type === AttrType.REFERENCE && afterAttr.RefTo) {
                const allAttrs = afterAttr.Parent.AllAttributes()

                {
                    const s = `${alterT} ${replaceAlign}DROP COLUMN${replaceAlign2} ${cc(beforeAttr.Name, 'sk')};`
                    script.push(s)
                }

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for (const [determinedKey, [calledFrom, a, isPk, isFk, validation, options]] of Object.entries(allAttrs)) {
                    const srcA = calledFrom[calledFrom.length - 1]
                    if (!srcA || (srcA && srcA?.Parent.ID !== afterAttr.Parent.ID)) continue

                    {
                        const s = `${alterT} ${replaceAlign}ADD COLUMN${replaceAlign2} ${LanguagePsqlService.generateAttrLine(determinedKey, a)};`
                        script.push(s)
                    }

                    {
                        const constraintName = afterAttr.Constraint('Foreign Key')
                        const parts = [
                            `${alterT} ${replaceAlign}ADD CONSTRAINT${replaceAlign2} ${constraintName} FOREIGN KEY ( ${determinedKey} ) REFERENCES ${
                                a.Parent.FN
                            } ( ${cc(a.Name, 'sk')} )`
                        ]

                        // if (afterAttr.Validation?.Required) {
                        //     parts.push('NOT NULL')
                        // }
                        // if (afterAttr.Option?.Default) {
                        //     let s = ''
                        //     if (afterAttr.isStr()) {
                        //         s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} '${afterAttr.Option?.Default}';`
                        //     } else {
                        //         s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} ${afterAttr.Option?.Default};`
                        //     }
                        //     parts.push(s)
                        // }

                        const s = parts.join(' ') + ';'
                        script.push(s)
                    }
                }
            } else if (afterAttr.Type !== beforeAttr.Type) {
                if (beforeAttr.Type === AttrType.REFERENCE && afterAttr.Type !== AttrType.REFERENCE) {
                    // const constraint = beforeAttr.Constraint('Foreign Key')
                    // const s = `${alterT} ${replaceAlign}DROP CONSTRAINT${replaceAlign2} ${constraint};`
                    // script.push(s)
                    {
                        // drop col
                        const allAttrs = beforeAttr.Parent.AllAttributes()
                        for (const [determinedKey, [calledFrom, a, isPk, isFk, validation, options]] of Object.entries(allAttrs)) {
                            const srcA = calledFrom[calledFrom.length - 1]
                            if (!srcA || (srcA && srcA?.Parent.ID !== beforeAttr.Parent.ID)) continue
                            const s = `${alterT} ${replaceAlign}DROP COLUMN${replaceAlign2} ${determinedKey};`
                            script.push(s)
                        }
                        const s = `${alterT} ${replaceAlign}ADD COLUMN${replaceAlign2} ${LanguagePsqlService.generateAttrLine(
                            cc(afterAttr.Name, 'sk'),
                            afterAttr
                        )};`
                        script.push(s)
                    }
                    // add
                    addReferenceColumn(afterAttr.Parent, alterT, afterAttr, alterA, script)
                } else {
                    const t = afterAttr.Type === AttrType.SERIAL ? 'INT' : afterAttr.Type
                    const s = `${alterA} TYPE ${t};`
                    script.push(s)
                }
            }
            // const s = `${alterA} TYPE ${PG_TO_PG_TYPE[a2.Type]};`
            // script.push(s)
        }
    }

    // Options
    if (beforeAttr.Option?.Default !== afterAttr.Option?.Default) {
        if (!beforeAttr.Option?.Default && afterAttr.Option?.Default !== undefined) {
            // add
            let s = ''
            if (beforeAttr.isStr()) {
                s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} '${afterAttr.Option?.Default}';`
            } else {
                s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} ${afterAttr.Option?.Default};`
            }
            script.push(s)
        } else if (!afterAttr.Option?.Default) {
            // remove
            const s = `${alterA} DROP DEFAULT;`
            script.push(s)
        } else {
            // update
            let s = ''
            if (beforeAttr.isStr()) {
                s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} '${afterAttr.Option?.Default}';`
            } else {
                s = `${alterA} ${replaceAlign}SET DEFAULT${replaceAlign2} ${afterAttr.Option?.Default};`
            }
            script.push(s)
        }
    }
    if (beforeAttr.Option?.SystemField !== afterAttr.Option?.SystemField) {
        if (!beforeAttr.Option?.PrimaryKey) {
            // add
        } else {
            // remove
        }
    }
    // Validation
    if (beforeAttr.Validation?.Required !== afterAttr.Validation?.Required) {
        if (!beforeAttr.Validation?.Required) {
            // add
            const s = `${alterA} SET NOT NULL;`
            script.push(s)
        } else {
            // remove
            const s = `${alterA} DROP NOT NULL;`
            script.push(s)
        }
    }
    if (beforeAttr.Validation?.Min !== afterAttr.Validation?.Min) {
        if (!beforeAttr.Validation?.Min) {
            // add
        } else if (!afterAttr.Validation?.Min) {
            // remove
        } else {
            // update
        }
    }
    maxChange: if (beforeAttr.Validation?.Max !== afterAttr.Validation?.Max) {
        if (!beforeAttr.Validation?.Max) {
            // add
        } else if (!afterAttr.Validation?.Max) {
            // remove
        } else {
            // update
            if (!afterAttr.isStr()) break maxChange
            if (typeChanged) {
                break maxChange
            } else {
                if (beforeAttr.isStr()) {
                    const s = `${alterA} TYPE ${afterAttr.VarcharType()};`
                    script.push(s)
                } else {
                    const s = `${alterA} TYPE ${PG_TO_PG_TYPE[afterAttr.Type]};`
                    script.push(s)
                }
            }
        }
    }
}
