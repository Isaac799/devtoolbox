import {CommonModule} from '@angular/common'
import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {PageTextEditorComponent} from '../page-text-editor/page-text-editor.component'
import {PG_TO_PG_TYPE, SchemaConfig} from '../../structure'
import {LanguagePsqlService} from '../../services/language/language-psql.service'
import {DataService} from '../../services/data.service'
import {cc} from '../../formatting'
import hljs from 'highlight.js'

@Component({
    standalone: true,
    selector: 'app-page-migration',
    imports: [CommonModule, FormsModule],
    templateUrl: './page-migration.component.html',
    styleUrl: './page-migration.component.scss'
})
export class PageMigrationComponent implements AfterViewInit {
    @ViewChild('fromEl') fromEl?: ElementRef<HTMLTextAreaElement>
    @ViewChild('toEl') toEl?: ElementRef<HTMLTextAreaElement>
    @ViewChild('outputEl') outputEl?: ElementRef<HTMLTextAreaElement>

    from: {
        parsed: Record<string, SchemaConfig>
        raw: string
    } = {
        parsed: {},
        raw: `# Shop

## Product
- id as ++
- name as str with unique, 3..30, d:hi
- age as int with unique`
    }

    to: {
        parsed: Record<string, SchemaConfig>
        raw: string
    } = {
        parsed: {},
        raw: `# Metadata

## Category
- identifier as ++
- title as str with required, unique, 3..30

# Shop

## Product
- id as ++
- name as str with required, unique, 3..40, d:hi2
- desc as str with required, unique, 4..50
- @category

## Log
- badge as ++
- called as str with required, unique, 6..60, d:hi2
`
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.Run()
        }, 0)
    }

    Run() {
        this.parse()
        const output = PageMigrationComponent.compare(this.from.parsed, this.to.parsed)
        const code = hljs.highlight(output, {language: 'sql'}).value
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
                                const alterA = `ALTER TABLE ${t1.FN} ALTER COLUMN ${cc(a1.Name, 'sk')}`
                                // Type
                                const typeChanged = a1.Type !== a2.Type
                                if (typeChanged) {
                                    if (a1.isStr()) {
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
                                            s = `${alterA} SET DEFAULT '${a2.Option?.Default}';`
                                        } else {
                                            s = `${alterA} SET DEFAULT ${a2.Option?.Default};`
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
                                            s = `${alterA} SET DEFAULT '${a2.Option?.Default}';`
                                        } else {
                                            s = `${alterA} SET DEFAULT ${a2.Option?.Default};`
                                        }
                                        script.push(s)
                                    }
                                }
                                if (a1.Option?.PrimaryKey !== a2.Option?.PrimaryKey) {
                                    if (!a1.Option?.PrimaryKey) {
                                        // add
                                        const s = `${alterT} ADD PRIMARY KEY ${cc(a2.Name, 'sk')};`
                                        script.push(s)
                                    } else {
                                        // remove
                                        const s = `${alterT} DROP CONSTRAINT ${t2.Constraint('Primary Key')};`
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
                                if (a1.Option?.Unique !== a2.Option?.Unique) {
                                    // compare array
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
                            const s = `${alterT} DROP COLUMN ${cc(a1.Name, 'sk')};`
                            script.push(s)
                        }
                    }
                    if (foundTable) {
                        continue
                    }
                    const s = `DROP TABLE ${t1.FN};`
                    script.push(s)
                }
            }
            if (foundSchema) {
                continue
            }
            const s = `DROP SCHEMA ${cc(s1.Name, 'sk')};`
            script.push(s)
        }

        script.push('\n--\n')

        // Only New Schemas
        for (const s2 of afterParsed) {
            let foundSchema = false
            for (const s1 of beforeParsed) {
                if (s1.Name === s2.Name) continue
                foundSchema = true
            }
            if (!foundSchema) continue
            console.log(s2.Name)
            const s = LanguagePsqlService.ToTables([s2], true)
            script.push(s.trim())
        }

        script.push('\n--\n')

        // Only New Tables
        for (const s2 of afterParsed) {
            for (const s1 of beforeParsed) {
                if (s1.Name !== s2.Name) continue
                //
                for (const t2 of s2.Tables) {
                    let foundTable = false
                    for (const t1 of s1.Tables) {
                        if (t1.Name === t2.Name) continue
                        foundTable = true
                    }
                    if (!foundTable) continue
                    const newTblLines = LanguagePsqlService.GenerateTable(false, t2)
                    script = script.concat(newTblLines)
                }
            }
        }

        script.push('\n--\n')

        // Only New Attributes
        for (const s2 of afterParsed) {
            for (const s1 of beforeParsed) {
                if (s1.Name !== s2.Name) continue
                //
                for (const t2 of s2.Tables) {
                    for (const t1 of s1.Tables) {
                        if (t1.Name !== t2.Name) continue
                        const alterT = `ALTER TABLE ${t2.FN}`
                        //
                        for (const a2 of t2.Attributes) {
                            let foundAttribute = false
                            for (const a1 of t1.Attributes) {
                                if (a1.Name !== a2.Name) continue
                                foundAttribute = true
                                // const alterA = `ALTER TABLE ${t1.FN} ALTER COLUMN ${cc(a1.Name, 'sk')}`
                            }
                            if (foundAttribute) continue
                            const s = `${alterT} ADD COLUMN ${LanguagePsqlService.generateAttrLine(cc(a2.Name, 'sk'), a2)};`
                            script.push(s)
                        }
                    }
                }
            }
        }

        return script.join('\n').trim()
    }

    cannotIncludeMacros() {
        // this.output = 'to-from cannot include macros'
    }
}
