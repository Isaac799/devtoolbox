import {AfterViewChecked, AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core'
import {
    Attribute,
    AttributeConfig,
    AttributeOptions,
    AttrType,
    attrTypeMap,
    attrTypeMapCompact,
    attrTypeMapExpanded,
    Schema,
    SchemaConfig,
    TableConfig,
    TextEditorSyntax,
    Validation
} from '../../structure'
import {v4 as uuidv4} from 'uuid'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {cc} from '../../formatting'
import {DataService} from '../../services/data.service'
import {MatButtonModule} from '@angular/material/button'
import {MatIconModule} from '@angular/material/icon'
import {MatSelectModule} from '@angular/material/select'
import {MatExpansionModule} from '@angular/material/expansion'
import {MatToolbar} from '@angular/material/toolbar'
import {MatSnackBar} from '@angular/material/snack-bar'
import {TextEditorService} from '../../services/text-editor.service'
import {AppService} from '../../services/app.service'

interface RenderE {
    innerText: string
    class?: string
}

@Component({
    selector: 'app-page-text-editor',
    imports: [CommonModule, FormsModule, MatButtonModule, MatExpansionModule, MatIconModule, MatSelectModule, MatToolbar],
    templateUrl: './page-text-editor.component.html',
    styleUrl: './page-text-editor.component.scss'
})
export class PageTextEditorComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('textEditor') textEditor: ElementRef<HTMLTextAreaElement> | null = null

    readonly dataService = inject(DataService)
    readonly textEditorService = inject(TextEditorService)
    private readonly appService = inject(AppService)

    renderElements: RenderE[] = []
    readonly NEWLINE = '~NEWLINE~'
    readonly SPACE = '~SPACE~'
    private readonly snackBar = inject(MatSnackBar)

    //     textInput = `
    // # public

    // ## author
    // - id as ++
    // - first name as string with required, unique:pair, 2..34
    // - last name as s with r, u:pair, 3..45

    // ## book
    // - id as ++
    // - title as string with 12..34,
    // - @author with required
    // - co author as author
    // `

    ngOnInit(): void {
        this.RefreshRender()
    }
    ngAfterViewInit(): void {
        this.textEditorService.textEditor = this.textEditor
    }
    ngOnDestroy(): void {
        this.textEditorService.textEditor = null
    }

    ToggleMode() {
        const s = this.dataService.app.textEditorSyntax

        if (s.attributes === 'Compact' && s.options === 'Compact') {
            s.attributes = 'Expanded'
        } else if (s.attributes === 'Expanded' && s.options === 'Expanded') {
            s.attributes = 'Compact'
        } else if (s.attributes === 'Compact' && s.options === 'Expanded') {
            s.options = 'Compact'
        } else if (s.attributes === 'Expanded' && s.options === 'Compact') {
            s.options = 'Expanded'
        }

        this.HardRefresh()
    }

    Run() {
        const config = PageTextEditorComponent.parse(this.textEditorService.textInput)
        this.appService.ReloadAndSaveFromConfig(config)
        this.Render(this.textEditorService.textInput)
    }

    Copy() {
        navigator.clipboard.writeText(this.textEditorService.textInput)
        this.snackBar.open('Copied your code to the clipboard', '', {
            duration: 2500
        })
    }

    Undo() {
        this.textEditorService.Undo()
        setTimeout(() => {
            this.appService.ReloadAndSave()
            this.RefreshRender()
        }, 0)
    }

    Redo() {
        this.textEditorService.Redo()
        setTimeout(() => {
            this.appService.ReloadAndSave()
            this.RefreshRender()
        }, 0)
    }

    Render(tbInput: string) {
        this.renderElements = []

        const lines = tbInput.split('\n')
        let newLines: RenderE[] = []

        for (const line of lines) {
            const newLine: RenderE[] = []
            const words2 = line.split(/(\s+|\S+|\n)/).filter(str => str.length > 0)
            let words: string[] = []
            for (const w of words2) {
                if (!w.trim()) {
                    words = words.concat(...w)
                    continue
                }
                words.push(w)
            }
            for (const word of words) {
                const newWord: RenderE = {innerText: word}
                if (newWord.innerText === ' ') {
                    newLine.push(newWord)
                    continue
                }
                if (word.startsWith('@')) {
                    newWord.class = 'is-ref'
                } else if (['with', 'as'].includes(word)) {
                    newWord.class = 'is-delimiter'
                } else if (['#', '##'].includes(word)) {
                    newWord.class = 'is-header'
                }
                newLine.push(newWord)
            }
            newLine.push({innerText: this.NEWLINE})
            newLines = newLines.concat(newLine)
        }

        this.renderElements = newLines
    }

    RefreshRender() {
        this.Render(this.textEditorService.textInput)
    }

    HardRefresh() {
        this.textEditorService.textInput = PageTextEditorComponent.reverseParse(this.dataService.schemas, this.dataService.app.textEditorSyntax)
        this.RefreshRender()
        this.appService.ReloadAndSave()
    }

    private static parse(input: string): Record<string, SchemaConfig> {
        const answer: Record<string, SchemaConfig> = {}

        const getAttrType = (input: string | null): AttrType | null => {
            if (!input) return null

            const normalizedInput = input.trim().toLowerCase()

            return attrTypeMap[normalizedInput] || null
        }

        const lastSchema = (): SchemaConfig => {
            const keys = Object.keys(answer)
            if (keys.length === 0) {
                const item: SchemaConfig = {
                    ID: uuidv4(),
                    Color: '',
                    Tables: {}
                }
                answer['unnamed schema'] = item
                return answer['unnamed schema']
            }
            const lastKey = keys[keys.length - 1]
            return answer[lastKey]
        }

        const lastTable = (): TableConfig => {
            const s = lastSchema()
            const keys = Object.keys(s.Tables)

            if (keys.length === 0) {
                const item: TableConfig = {
                    ID: uuidv4(),
                    Attributes: {},
                    dragPosition: {
                        x: 0,
                        y: 0
                    }
                }
                s.Tables['unnamed table'] = item
                return s.Tables['unnamed table']
            }
            const lastKey = keys[keys.length - 1]
            return s.Tables[lastKey]
        }

        // const lastAttribute = (): AttributeConfig => {
        //     const t = lastTable()
        //     const keys = Object.keys(t.Attributes)

        //     if (keys.length === 0) {
        //         const item: AttributeConfig = {
        //             ID: uuidv4(),
        //             Type: AttrType.BOOLEAN
        //         }
        //         t.Attributes['unnamed attribute'] = item
        //         return t.Attributes['unnamed attribute']
        //     }
        //     const lastKey = keys[keys.length - 1]
        //     return t.Attributes[lastKey]
        // }

        const lines = input
            .split('\n')
            .map(e => e.trim())
            .filter(e => e.length > 3)

        for (const line of lines) {
            if (line.startsWith('# ')) {
                const name = cc(line.substring(2, line.length).trim(), 'sk')
                const item: SchemaConfig = {
                    ID: uuidv4(),
                    Color: '',
                    Tables: {}
                }
                answer[name] = item
            } else if (line.startsWith('##')) {
                const name = cc(line.substring(2, line.length).trim(), 'sk')
                const item: TableConfig = {
                    ID: uuidv4(),
                    Attributes: {},
                    dragPosition: {
                        x: 0,
                        y: 0
                    }
                }
                lastSchema().Tables[name] = item
            } else if (line.startsWith('- ')) {
                let cleanLine = line.substring(2, line.length).trim()

                if (cleanLine.startsWith('@')) {
                    const a = cleanLine.split(' with ')
                    const name = a[0] || ''
                    if (!name) {
                        continue
                    }
                    const refName = name.substring(1, name.length)
                    const newParts: string[] = [`${refName} as reference`]
                    if (a[1]) {
                        newParts.push(a[1])
                    }
                    cleanLine = newParts
                        .map(e => e.trim())
                        .filter(e => e)
                        .join(' with ')
                }

                const a = cleanLine.split(' with ')
                const b = a[0].split(' as ')

                const name = cc(b[0], 'sk')
                const potentialType = b[1]
                let type = getAttrType(potentialType)
                const options = (a[1] || '')
                    .split(',')
                    .map(e => e.trim())
                    .filter(e => e)

                let refToID = ''

                if (!type) {
                    let matchingTblID = ''

                    search: for (const sk in answer) {
                        const s = answer[sk]
                        for (const tk in s.Tables) {
                            const t = s.Tables[tk]
                            if (tk !== potentialType && `${sk}.${tk}` !== potentialType && `${sk}:${tk}` !== potentialType) {
                                continue
                            }
                            matchingTblID = t.ID
                            break search
                        }
                    }

                    if (!matchingTblID) {
                        // console.warn('cannot find reference from type')
                        continue
                    }
                    refToID = matchingTblID
                    type = AttrType.REFERENCE
                }

                const attrValidation: Validation = {}
                const attrOptions: AttributeOptions = {}

                for (const option of options) {
                    if (option.startsWith('p')) {
                        attrOptions.PrimaryKey = true
                    } else if (option.startsWith('s')) {
                        attrOptions.SystemField = true
                    } else if (option.startsWith('r')) {
                        attrValidation.Required = true
                    } else if (option.startsWith('u')) {
                        const uSplit = option.split(':')
                        const label = uSplit[1] || 'unlabeled'
                        if (!attrOptions.Unique) {
                            attrOptions.Unique = []
                        }
                        if (!attrOptions.Unique.includes(label)) {
                            attrOptions.Unique.push(label)
                        }
                    } else {
                        const range = option.split('..')
                        if (range.length !== 2) {
                            continue
                        }
                        const min = range[0]
                        const parsedMin = parseFloat(min)
                        if (!Number.isNaN(parsedMin)) {
                            attrValidation.Min = parsedMin
                        }

                        const max = range[1]
                        const parsedMax = parseFloat(max)
                        if (!Number.isNaN(parsedMax)) {
                            attrValidation.Max = parsedMax
                        }
                    }
                }

                const item: AttributeConfig = {
                    ID: uuidv4(),
                    Type: type,
                    Validation: attrValidation,
                    Option: attrOptions
                }

                if (refToID && item.Type === AttrType.REFERENCE) {
                    item.RefToID = refToID
                } else if (!refToID && item.Type === AttrType.REFERENCE) {
                    search: for (const sk in answer) {
                        const s = answer[sk]
                        for (const tk in s.Tables) {
                            const t = s.Tables[tk]
                            if (tk !== name) {
                                continue
                            }
                            refToID = t.ID
                            break search
                        }
                    }

                    if (!refToID) {
                        console.warn('cannot find reference')
                        continue
                    }

                    item.RefToID = refToID
                }

                lastTable().Attributes[name] = item
            }
        }

        return answer
    }

    static reverseParse(schemas: Schema[], textEditorSyntax: TextEditorSyntax): string {
        const lines: string[] = []

        const getAttrType = (input: AttrType): string | null => {
            if (!input) return null

            if (textEditorSyntax.attributes === 'Compact') {
                return attrTypeMapCompact[input] || null
            } else if (textEditorSyntax.attributes === 'Expanded') {
                return attrTypeMapExpanded[input] || null
            } else {
                console.warn('unhandled TextEditorSyntaxMode')
                return null
            }
        }

        for (const s of schemas) {
            lines.push(``)
            lines.push(`# ${s.Name}`)
            for (const t of s.Tables) {
                lines.push(``)
                lines.push(`## ${t.Name}`)
                for (const a of t.Attributes) {
                    const type = getAttrType(a.Type)

                    if (!type) {
                        continue
                    }

                    getAttrType(a.Type)

                    let nameAndType = `${a.Name} as ${type}`
                    if (a.Type === AttrType.REFERENCE && a.RefTo) {
                        if (a.Name === a.RefTo.Name) {
                            nameAndType = `@${a.RefTo.Name}`
                        }
                    }

                    const newParts: string[] = [`- ${nameAndType}`]

                    const options: string[] = gatherOptions(a)

                    newParts.push(options.join(', '))

                    const line = newParts
                        .map(e => e.trim())
                        .filter(e => e)
                        .join(' with ')

                    lines.push(line)
                }
            }
        }

        return lines.join('\n').trim()

        function gatherOptions(a: Attribute) {
            const options: string[] = []

            if (a.Option?.PrimaryKey) {
                if (textEditorSyntax.options === 'Compact') {
                    options.push('p')
                } else {
                    options.push('primary')
                }
            }
            if (a.Option?.SystemField) {
                if (textEditorSyntax.options === 'Compact') {
                    options.push('sys')
                } else {
                    options.push('system')
                }
            }
            if (a.Option?.Unique) {
                if (textEditorSyntax.options === 'Compact') {
                    options.push('u')
                } else {
                    options.push('unique')
                }
            }
            if (a.Option?.Default) {
                if (textEditorSyntax.options === 'Compact') {
                    options.push('d')
                } else {
                    options.push('default')
                }
            }
            if (a.Validation?.Required) {
                if (textEditorSyntax.options === 'Compact') {
                    options.push('r')
                } else {
                    options.push('required')
                }
            }

            const min = a.Validation?.Min
            const max = a.Validation?.Max
            if (min || max) {
                options.push(`${min || ''}..${max || ''}`)
            }
            return options
        }
    }
}
