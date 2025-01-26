/* eslint-disable @typescript-eslint/prefer-for-of */
import {TAB} from '../../constants'
import {alignKeyword, cc} from '../../formatting'
import {AttrType, generateSeedData, Schema} from '../../structure'
import {AttributeMap} from '../../varchar'

function genRandomRef(max: number): number {
    return Math.floor(Math.random() * max) + 1
}

export function SchemasToPostgresSeed(schemas: Schema[], map: AttributeMap): string {
    const lines: string[] = []

    const tGenCount: Record<string, number> = {}

    const usedMap: Record<string, string[]> = {}

    const tblRows: Record<string, number> = {}

    for (const s of schemas) {
        lines.push('')
        for (const t of s.Tables) {
            let values: string[] = []
            const alignmentKeyword = `~|~|~`

            let v2: string[] = []
            let v3: string[] = []
            for (let i = 0; i < t.Attributes.length; i++) {
                const a = t.Attributes[i]
                v2.push(cc(a.Name, 'sk'))
                v3.push('-'.repeat(cc(a.Name, 'sk').length))
            }

            const c = `\n${TAB}( ${v2.join(`,${alignmentKeyword} `)} )`
            const c2 = `\n${TAB}  ${v3.join(` ${alignmentKeyword} `)}`
            values.push(c)
            values.push(c2)
            v2 = []
            v3 = []

            if (tblRows[t.FN] === undefined) {
                tblRows[t.FN] = 0
            }

            let u = false

            adding: for (let index = 0; index < 20; index++) {
                for (let i = 0; i < t.Attributes.length; i++) {
                    const a = t.Attributes[i]
                    u = a.Option?.Unique || a.Option?.PrimaryKey || false

                    if (a.Type === AttrType.SERIAL) {
                        u = false
                    }

                    // for (let j = 0; j < 4; j++) {

                    if (!u) {
                        let v = ''
                        if (a.Type === AttrType.REFERENCE && a.RefTo) {
                            v = genRandomRef(tblRows[a.RefTo.FN]) + ''
                        } else {
                            v = `${generateSeedData(a, map)}`
                        }
                        v2.push(v)
                    }
                    if (u) {
                        let v = ''

                        if (!usedMap[a.FN]) {
                            usedMap[a.FN] = []
                        }
                        let escape = 0
                        do {
                            if (escape > 100) {
                                // console.warn('break unique: ', t.Name)
                                break adding
                            }
                            escape += 1
                            if (a.Type === AttrType.REFERENCE && a.RefTo) {
                                v = genRandomRef(tblRows[a.RefTo.FN]) + ''
                            } else {
                                v = `${generateSeedData(a, map)}`
                            }
                        } while (usedMap[a.FN].includes(v))

                        v2.push(v)
                        usedMap[a.FN].push(v)
                    }
                }
                const c = `\n${TAB}( ${v2.join(`,${alignmentKeyword} `)} )`

                if (u && values.map(e => e.includes(c)).filter(e => e).length !== 0) {
                    v2 = []
                    continue
                }

                if (tGenCount[t.FNInitials] === undefined) {
                    tGenCount[t.FNInitials] = 0
                }
                tGenCount[t.FNInitials] += 1

                values.push(c)
                tblRows[t.FN] += 1

                v2 = []
            }

            // console.log('tblRows[t.FN] :>> ', t.FN, tblRows[t.FN])

            for (let index = 0; index < t.Attributes.length; index++) {
                values = alignKeyword(values, alignmentKeyword)
                values = values.map(e => e.replace(alignmentKeyword, ''))
            }
            const stmt: string[] = ['INSERT INTO', t.FN, 'VALUES']

            const lineParts = [stmt.join(' '), values, ';']

            const line: string = lineParts.join(' ')
            lines.push(line)
            lines.push('')
        }
    }
    const all = ['BEGIN;', '', ...lines, '', 'COMMIT;']
    const str = all.join('\n')
    return str
}
