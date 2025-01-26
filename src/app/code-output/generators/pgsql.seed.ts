/* eslint-disable @typescript-eslint/prefer-for-of */
import {TAB} from '../../constants'
import {alignKeyword, cc} from '../../formatting'
import {generateSeedData, Schema} from '../../structure'

export function SchemasToPostgresSeed(schemas: Schema[]): string {
    const lines: string[] = []

    const tGenCount: Record<string, number> = {}

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

            let u = false

            for (let index = 0; index < 25; index++) {
                for (let i = 0; i < t.Attributes.length; i++) {
                    const a = t.Attributes[i]
                    u = a.Option?.Unique || false
                    // for (let j = 0; j < 4; j++) {
                    v2.push(`${generateSeedData(a)}`)
                    // }
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
                v2 = []
            }
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
