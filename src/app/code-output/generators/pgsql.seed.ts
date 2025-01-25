/* eslint-disable @typescript-eslint/prefer-for-of */
import {TAB} from '../../constants'
import {alignKeyword, cc} from '../../formatting'
import {generateSeedData, Schema} from '../../structure'

export function SchemasToPostgresSeed(schemas: Schema[]): string {
    const lines: string[] = []

    for (const s of schemas) {
        lines.push('')
        for (const t of s.Tables) {
            let values: string[] = []
            const alignmentKeyword = `~|~|~`

            let v2: string[] = []
            for (let i = 0; i < t.Attributes.length; i++) {
                const a = t.Attributes[i]
                v2.push(cc(a.Name, 'sk'))
            }

            const c = `\n${TAB}( ${v2.join(`,${alignmentKeyword} `)} )`
            values.push(c)
            v2 = []

            let u = false
            for (let index = 0; index < 50; index++) {
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
