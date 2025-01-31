import {Component, OnInit} from '@angular/core'
import {AttributeConfig, AttrType, attrTypeMap, SchemaConfig, TableConfig} from '../../structure'
import {v4 as uuidv4} from 'uuid'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {cc} from '../../formatting'

enum State {
    N,
    S,
    T,
    A,
    AO,
    BR,
    BU
}

@Component({
    selector: 'app-page-text-editor',
    imports: [CommonModule, FormsModule],
    templateUrl: './page-text-editor.component.html',
    styleUrl: './page-text-editor.component.scss'
})
export class PageTextEditorComponent implements OnInit {
    textInput = `
# public

## author
- ++ id
- string first name
- word last name

## book
- ++ id 
- str title | 12..34
- ^ author | required

`
    attributeOptionKeywordMap = new Map<string, string>()

    ngOnInit(): void {
        this.buildMap()
    }

    Run() {
        const config = PageTextEditorComponent.parse(this.textInput, this.attributeOptionKeywordMap)
        console.log(JSON.stringify(config, null, 4))
    }

    private static parse(input: string, attributeOptionKeywordMap: Map<string, string>): Record<string, SchemaConfig> {
        const answer: Record<string, SchemaConfig> = {}
        let state: State = State.N
        let stack = ''
        const chars = input.split('')

        let determinedAttrType: AttrType | null = null
        let uniqueStr = ''

        const getAttrType = (input: string | null): AttrType | null => {
            if (!input) return null

            const normalizedInput = input.toLowerCase()

            return attrTypeMap[normalizedInput] || null
        }

        const isChar = (c: string): boolean => {
            return c.match(/[a-zA-Z ]/) !== null
        }

        const isNum = (c: string): boolean => {
            return c.match(/[0-9]/) !== null
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

        const lastAttribute = (): AttributeConfig => {
            const t = lastTable()
            const keys = Object.keys(t.Attributes)

            if (keys.length === 0) {
                const item: AttributeConfig = {
                    ID: uuidv4(),
                    Type: AttrType.BOOLEAN
                }
                t.Attributes['unnamed attribute'] = item
                return t.Attributes['unnamed attribute']
            }
            const lastKey = keys[keys.length - 1]
            return t.Attributes[lastKey]
        }

        for (const c of chars) {
            if (!c) continue

            if (!stack) {
                stack += c
                continue
            }

            if (state === State.N) {
                const candidate = stack.replaceAll('\r', '').replaceAll('\n', '')

                if (candidate === '# ') {
                    console.log('Schema start')
                    state = State.S
                    stack = ''
                    stack += c
                    continue
                } else if (candidate === '##') {
                    console.log('Table start')
                    state = State.T
                    stack = ''
                    continue
                } else if (candidate === '- ') {
                    console.log('Attribute start')

                    state = State.A
                    stack = ''
                    stack += c
                    continue
                }

                stack += c
                continue
            }

            if (state === State.BU) {
                if (c === ')') {
                    state = State.AO
                    const o = lastAttribute().Option
                    if (o) {
                        o.Unique = uniqueStr.split(',')
                    }
                    uniqueStr = ''
                    continue
                }
                uniqueStr += c
                continue
            } else if (state === State.BR) {
                if (isNum(c) || c === '.') {
                    stack += c
                    continue
                }
                const a = lastAttribute()

                if (!a.Validation) {
                    a.Validation = {}
                }

                const parts = stack.split('..')

                const min = parts[0]
                const parsedMin = parseFloat(min)
                if (!Number.isNaN(parsedMin)) {
                    a.Validation.Min = parsedMin
                }

                const max = parts[1]
                const parsedMax = parseFloat(max)
                if (!Number.isNaN(parsedMax)) {
                    a.Validation.Max = parsedMax
                }

                state = State.AO
                stack = ''
                continue
            } else if (state === State.S) {
                if (!isChar(c)) {
                    const item: SchemaConfig = {
                        ID: uuidv4(),
                        Color: '',
                        Tables: {}
                    }
                    const name = cc(stack.trim(), 'sk')
                    answer[name] = item
                    state = State.N
                    stack = ''
                    continue
                }
            } else if (state === State.T) {
                if (!isChar(c)) {
                    const item: TableConfig = {
                        ID: uuidv4(),
                        Attributes: {},
                        dragPosition: {
                            x: 0,
                            y: 0
                        }
                    }

                    const name = cc(stack.trim(), 'sk')
                    lastSchema().Tables[name] = item
                    state = State.N
                    stack = ''
                    continue
                }
            } else if (state === State.A) {
                if (c === '|') {
                    state = State.AO
                    stack = ''
                    continue
                }
                if (!determinedAttrType && c === ' ') {
                    determinedAttrType = getAttrType(stack)
                    if (determinedAttrType) {
                        stack = ''
                    }
                } else if (!isChar(c) && determinedAttrType) {
                    const item: AttributeConfig = {
                        ID: uuidv4(),
                        Type: determinedAttrType
                    }
                    determinedAttrType = null

                    const name = cc(stack.trim(), 'sk')

                    if (item.Type === AttrType.REFERENCE) {
                        let refTo = ''

                        search: for (const sk in answer) {
                            const s = answer[sk]
                            for (const tk in s.Tables) {
                                const t = s.Tables[tk]
                                if (tk !== name) {
                                    continue
                                }
                                refTo = t.ID
                                break search
                            }
                        }

                        if (!refTo) {
                            console.warn('cannot find reference')
                            stack = ''
                            state = State.N
                            continue
                        }

                        item.RefToID = refTo
                    }

                    lastTable().Attributes[name] = item
                    stack = ''
                    state = State.N
                    continue
                }
            } else if (state === State.AO) {
                const a = lastAttribute()

                if (!a.Option) {
                    a.Option = {}
                }

                if (isNum(c) || (c === '.' && !stack.includes('.'))) {
                    console.log('starting to build range')
                    state = State.BR
                    stack += c
                    continue
                }

                if (isChar(c)) {
                    const option = attributeOptionKeywordMap.get(stack.trim().toLowerCase())

                    if (option) {
                        switch (option) {
                            case 'p':
                                a.Option.PrimaryKey = true
                                stack = ''
                                break
                            case 'u':
                                a.Option.Unique = []
                                state = State.BU
                                stack = ''
                                break
                            case 's':
                                a.Option.SystemField = true
                                stack = ''
                                break
                            case 'r':
                                if (!a.Validation) {
                                    a.Validation = {}
                                }
                                a.Validation.Required = true
                                stack = ''
                                break
                            default:
                                console.warn('unknown attribute option: ', option)
                                stack = ''
                                break
                        }
                    }
                }
            }
            stack += c
        }

        return answer
    }

    private buildMap() {
        const pk = ['p', 'pk', 'primary']
        for (const e of pk) {
            this.attributeOptionKeywordMap.set(e, 'p')
        }

        const u = ['u', 'un', 'unique']
        for (const e of u) {
            this.attributeOptionKeywordMap.set(e, 'u')
        }

        const s = ['s', 'sy', 'sys', 'system']
        for (const e of s) {
            this.attributeOptionKeywordMap.set(e, 's')
        }

        const r = ['r', 'req', 'required']
        for (const e of r) {
            this.attributeOptionKeywordMap.set(e, 'r')
        }
    }
}
