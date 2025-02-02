import {AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core'
import {
    Attribute,
    AttributeConfig,
    AttributeOptions,
    AttrType,
    attrTypeMap,
    attrTypeMapCompact,
    attrTypeMapExpanded,
    ParseResult,
    RenderE,
    Schema,
    SchemaConfig,
    Suggestions,
    TableConfig,
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
import {BitwiseOperations} from '../../constants'
import {MatDialog} from '@angular/material/dialog'
import {DialogSyntaxGuideComponent} from '../../dialogs/dialog-syntax-guide/dialog-syntax-guide.component'

@Component({
    selector: 'app-page-text-editor',
    imports: [CommonModule, FormsModule, MatButtonModule, MatExpansionModule, MatIconModule, MatSelectModule, MatToolbar],
    templateUrl: './page-text-editor.component.html',
    styleUrl: './page-text-editor.component.scss'
})
export class PageTextEditorComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('textEditor') textEditor: ElementRef<HTMLTextAreaElement> | null = null
    @ViewChild('inputContainer') inputContainer: ElementRef<HTMLDivElement> | null = null

    readonly dataService = inject(DataService)
    readonly textEditorService = inject(TextEditorService)

    private readonly matDialog = inject(MatDialog)
    private readonly appService = inject(AppService)

    justCleaned = false
    toggleMode = 0
    readonly SPACE = '~SPACE~'
    readonly NEWLINE = '~NEWLINE~'
    renderElements: RenderE[] = []
    renderSuggestionElements: RenderE[] = []
    private readonly snackBar = inject(MatSnackBar)
    private runDebounce: ReturnType<typeof setTimeout> | undefined = undefined
    private suggestionDebounce: ReturnType<typeof setTimeout> | undefined = undefined

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
        this.textEditorService.rerun.subscribe(() => {
            this.Run()
        })
    }
    ngAfterViewInit(): void {
        this.textEditorService.textEditor = this.textEditor
        const lines = this.textEditorService.textInput.split('\n').length
        this.AdjustEditorHeight(lines)
    }
    ngOnDestroy(): void {
        this.textEditorService.textEditor = null
    }

    ToggleMode() {
        const s = this.dataService.app.textEditorState
        const aC = TextEditorService.AttributeTypeCompact
        const oC = TextEditorService.AttributeOptionCompact

        if (this.toggleMode === 0) {
            this.dataService.app.textEditorState = BitwiseOperations.toggleBit(s, aC)
            this.toggleMode = 1
        } else {
            this.toggleMode = 0
            this.dataService.app.textEditorState = BitwiseOperations.toggleBit(s, oC)
        }

        this.HardRefresh()
    }

    Run() {
        this.justCleaned = false
        this.dataService.previousParse = PageTextEditorComponent.parse(this.textEditorService.textInput)
        this.Render(this.textEditorService.textInput, this.dataService.previousParse)

        clearTimeout(this.runDebounce)
        this.runDebounce = setTimeout(() => {
            this.appService.ReloadAndSaveFromConfig()
        }, 300)
    }

    OpenSyntaxGuide() {
        this.matDialog.open(DialogSyntaxGuideComponent)
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

    Render(textAreaInput: string, previousParse: ParseResult) {
        this.renderElements = []

        const lines = textAreaInput.split('\n')

        this.AdjustEditorHeight(lines.length)

        let newLines: RenderE[] = []

        for (const line of lines) {
            const newLine: RenderE[] = []
            const words = this.ExtractLineWords(line)

            for (const word of words) {
                const el: RenderE = {innerText: word}
                if (el.innerText === ' ') {
                    newLine.push(el)
                    continue
                }
                if (word.startsWith('@')) {
                    el.class = 'is-shortcut'
                } else if (['with', 'as'].includes(word)) {
                    el.class = 'is-delimiter'
                } else if (['#', '##'].includes(word)) {
                    el.class = 'is-header'
                }
                newLine.push(el)
            }
            newLine.push({innerText: this.NEWLINE})
            newLines = newLines.concat(newLine)
        }

        this.renderElements = newLines

        clearTimeout(this.suggestionDebounce)
        this.suggestionDebounce = setTimeout(() => {
            this.RenderSuggestions(textAreaInput, previousParse)
        }, 300)
    }

    private AdjustEditorHeight(lines: number) {
        if (this.inputContainer) {
            if (lines < 20) {
                lines = 20
            }
            this.inputContainer.nativeElement.style.height = lines + 'rem'
        }
    }

    private RenderSuggestions(textAreaInput: string, parsed: ParseResult) {
        if (!parsed) {
            return
        }

        this.renderSuggestionElements = []

        const lines = textAreaInput.split('\n')
        let newLines: RenderE[] = []

        let li = 0

        for (const line of lines) {
            li += 1

            const suggestions = (parsed.suggestions || [])[li]
            const errors = (parsed.errors || [])[li]

            const newLine: RenderE[] = []
            const words = this.ExtractLineWords(line)

            for (const word of words) {
                const el: RenderE = {innerText: word}
                newLine.push(el)
            }

            if (suggestions) {
                const revised: string[] = consolidateSuggestions(suggestions)
                const tip = {innerText: revised.join(', '), class: 'is-suggestion'}
                newLine.push(tip)
            }

            if (errors) {
                const revised: string[] = consolidateSuggestions(errors)
                const tip = {innerText: revised.join(', '), class: 'is-error'}
                newLine.push(tip)
            }

            newLine.push({innerText: this.NEWLINE})
            newLines = newLines.concat(newLine)
        }

        this.renderSuggestionElements = newLines
    }

    private ExtractLineWords(line: string): string[] {
        let words: string[] = []
        const words2 = line.split(/(\s+|\S+|\n)/).filter(str => str.length > 0)
        for (const w of words2) {
            if (!w.trim()) {
                words = words.concat(...w)
                continue
            }
            words.push(w)
        }
        return words
    }

    RefreshRender() {
        if (!this.dataService.previousParse) {
            console.warn('missing previous parse')
            return
        }
        this.Render(this.textEditorService.textInput, this.dataService.previousParse)
    }

    HardRefresh() {
        this.textEditorService.textInput = PageTextEditorComponent.reverseParse(this.dataService.schemas, this.dataService.app.textEditorState)
        this.RefreshRender()
        this.appService.ReloadAndSave()
        this.justCleaned = true
    }

    static parse(input: string): ParseResult {
        const answer: Record<string, SchemaConfig> = {}
        const suggestions: Suggestions = {}
        const errors: Suggestions = {}

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

        const lines = input.split('\n').map(e => e.trim())

        let li = 0
        for (const line of lines) {
            const addSuggestion = (x: string): void => {
                const last = lastTable()
                if (!last.Suggestions) {
                    last.Suggestions = []
                }
                if (!suggestions[li]) {
                    suggestions[li] = []
                }
                suggestions[li].push(x)
            }
            const addError = (x: string): void => {
                const last = lastTable()
                if (!last.Errors) {
                    last.Errors = []
                }
                if (!errors[li]) {
                    errors[li] = []
                }
                errors[li].push(x)
            }
            li += 1

            if (line.startsWith('# ')) {
                const name = cc(line.substring(2, line.length).trim(), 'sk')

                const exists = answer[name] !== undefined
                if (exists) {
                    addError('this category already exists')
                    continue
                }

                const item: SchemaConfig = {
                    ID: uuidv4(),
                    Color: '',
                    Tables: {}
                }

                answer[name] = item
            } else if (line.startsWith('##')) {
                const name = cc(line.substring(2, line.length).trim(), 'sk')

                const exists = lastSchema().Tables[name] !== undefined
                if (exists) {
                    addError('this blueprint already exists')
                    continue
                }

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
                    const a = cleanLine.split(' with')
                    const name = a[0] || ''
                    if (!name) {
                        addError('an attribute was missing name')
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

                const a = cleanLine.split(' with')
                const b = a[0].split(' as')

                const name = cc(b[0], 'sk')

                const exists = lastTable().Attributes[name] !== undefined
                if (exists) {
                    addError('this attribute already exists')
                    continue
                }

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
                        addError('cannot determine type')
                        continue
                    }
                    refToID = matchingTblID
                    type = AttrType.REFERENCE
                }

                const attrValidation: Validation = {}
                const attrOptions: AttributeOptions = {}

                if (line.includes('with') && options.length === 0 && type !== AttrType.SERIAL) {
                    addSuggestion('no options')
                } else if (line.includes('with') && options.length > 0 && type === AttrType.SERIAL) {
                    addSuggestion('options are redundant')
                } else if (line.includes('with') && type === AttrType.SERIAL) {
                    addSuggestion(`'with' is unnecessary`)
                }

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
                            addError('unknown option')
                            continue
                        }

                        const min = range[0]
                        const max = range[1]

                        function isValidNumber(str: string): boolean {
                            const regex = /^[0-9]*\.?[0-9]+$/
                            return regex.test(str)
                        }

                        if (min && !isValidNumber(min)) {
                            addError(`invalid min value`)
                            continue
                        } else if (max && !isValidNumber(max)) {
                            addError(`invalid max value`)
                            continue
                        }

                        const parsedMin = parseFloat(min)
                        const parsedMax = parseFloat(max)

                        if (!Number.isNaN(parsedMin) && !Number.isNaN(parsedMax) && parsedMin > parsedMax) {
                            addError(`invalid range`)
                            continue
                        }

                        if (!Number.isNaN(parsedMin)) {
                            attrValidation.Min = parsedMin
                        }
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
                        addError(`cannot find '${name}'`)
                        continue
                    }

                    item.RefToID = refToID
                }

                const max = item.Validation?.Max

                if (item.Type === AttrType.VARCHAR && max === undefined) {
                    addError('missing range max')
                } else if (item.Type === AttrType.VARCHAR && max !== undefined && max < 2) {
                    addSuggestion(`consider using 'character' type`)
                } else lastTable().Attributes[name] = item
            }
        }

        return {
            data: answer,
            suggestions,
            errors
        }
    }

    static reverseParse(schemas: Schema[], textEditorState: number): string {
        const lines: string[] = []

        const getAttrType = (input: AttrType): string | null => {
            if (!input) return null

            if (BitwiseOperations.isBitSet(textEditorState, TextEditorService.AttributeTypeCompact)) {
                return attrTypeMapCompact[input] || null
            } else {
                return attrTypeMapExpanded[input] || null
            }
        }

        for (const s of schemas) {
            lines.push(``)
            lines.push(`# ${cc(s.Name, 'tc')}`)
            for (const t of s.Tables) {
                lines.push(``)
                lines.push(`## ${cc(t.Name, 'tc')}`)
                for (const a of t.Attributes) {
                    const type = getAttrType(a.Type)

                    if (!type) {
                        continue
                    }

                    getAttrType(a.Type)

                    let nameAndType = `${cc(a.Name, 'nc')} as ${type}`
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

            const optionCompact = BitwiseOperations.isBitSet(textEditorState, TextEditorService.AttributeOptionCompact)

            if (a.Option?.PrimaryKey && a.Type !== AttrType.SERIAL) {
                if (optionCompact) {
                    options.push('p')
                } else {
                    options.push('primary')
                }
            }
            if (a.Option?.SystemField && a.Type !== AttrType.SERIAL) {
                if (optionCompact) {
                    options.push('sys')
                } else {
                    options.push('system')
                }
            }
            if (a.Option?.Unique && a.Type !== AttrType.SERIAL) {
                for (const u of a.Option.Unique) {
                    if (optionCompact) {
                        if (u === 'unlabeled') {
                            options.push(`u`)
                        } else {
                            options.push(`u:${u}`)
                        }
                    } else {
                        if (u === 'unlabeled') {
                            options.push(`unique`)
                        } else {
                            options.push(`unique:${u}`)
                        }
                    }
                }
            }
            if (a.Option?.Default) {
                if (optionCompact) {
                    options.push('d')
                } else {
                    options.push('default')
                }
            }
            if (a.Validation?.Required && a.Type !== AttrType.SERIAL) {
                if (optionCompact) {
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
function consolidateSuggestions(suggestions: string[]) {
    const counter: Record<string, number> = {}
    for (const s of suggestions) {
        if (!counter[s]) {
            counter[s] = 0
        }
        counter[s] += 1
    }

    const suggestionsRevised: string[] = []
    for (const s in counter) {
        const count = counter[s]
        if (count > 1) {
            suggestionsRevised.push(s + `s (${count})`)
        } else {
            suggestionsRevised.push(s)
        }
    }
    return suggestionsRevised
}
