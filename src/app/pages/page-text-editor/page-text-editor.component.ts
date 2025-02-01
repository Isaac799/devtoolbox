import {Component, OnInit} from '@angular/core'
import {AttributeConfig, AttributeOptions, AttrType, attrTypeMap, SchemaConfig, TableConfig, Validation} from '../../structure'
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
- id as ++
- first name as string with required, unique:pair, 2..34
- last name as s with r, u:pair, 3..45

## book
- id as ++
- title as string with 12..34, 
- @author with required
- co author as author
`

    ngOnInit(): void {
        this.Run()
    }

    Run() {
        const config = PageTextEditorComponent.parse(this.textInput)
        console.log(JSON.stringify(config, null, 4))
    }

    private static parse(input: string): Record<string, SchemaConfig> {
        const answer: Record<string, SchemaConfig> = {}

        const getAttrType = (input: string | null): AttrType | null => {
            if (!input) return null

            const normalizedInput = input.toLowerCase()

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
                console.log('schema', line)
                const name = cc(line.substring(2, line.length).trim(), 'sk')
                const item: SchemaConfig = {
                    ID: uuidv4(),
                    Color: '',
                    Tables: {}
                }
                answer[name] = item
            } else if (line.startsWith('##')) {
                console.log('table', line)
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
                    cleanLine = newParts.join(' with ')
                }

                console.log('attribute: ', cleanLine)

                const a = cleanLine.split(' with ')
                const b = a[0].split(' as ')

                const name = cc(b[0], 'sk')
                const potentialType = b[1]
                let type = getAttrType(potentialType)
                const options = (a[1] || '')
                    .split(',')
                    .map(e => e.trim())
                    .filter(e => e)

                let refTo = ''

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
                        console.warn('cannot find reference from type')
                        continue
                    }
                    refTo = matchingTblID
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

                if (refTo && item.Type === AttrType.REFERENCE) {
                    item.RefToID = refTo
                } else if (!refTo && item.Type === AttrType.REFERENCE) {
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
                        continue
                    }

                    item.RefToID = refTo
                }

                lastTable().Attributes[name] = item
            }
        }

        return answer
    }
}
