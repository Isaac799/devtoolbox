/* eslint-disable @typescript-eslint/prefer-for-of */
import {TAB} from '../../constants'
import {alignKeyword, cc} from '../../formatting'
import {generateSeedData, Schema} from '../../structure'

export function SchemasToPostgresSeed(schemas: Schema[]): string {
    const lines: string[] = []

    for (const s of schemas) {
        lines.push('')
        for (const t of s.Tables) {
            const cols: string[] = []
            const values: string[] = []

            for (let i = 0; i < t.Attributes.length; i++) {
                const a = t.Attributes[i]
                cols.push(cc(a.Name, 'sk'))
            }

            let u = false
            let v2: string[] = []
            for (let index = 0; index < 30; index++) {
                for (let i = 0; i < t.Attributes.length; i++) {
                    const a = t.Attributes[i]
                    u = a.Option?.Unique || false
                    // for (let j = 0; j < 4; j++) {
                    v2.push(`${generateSeedData(a)}`)
                    // }
                }
                const c = `\n${TAB}( ${v2.join(`, `)} )`

                if (u && values.map(e => e.includes(c)).filter(e => e).length !== 0) {
                    v2 = []
                    continue
                }

                values.push(c)
                v2 = []
            }

            const stmt: string[] = ['INSERT INTO', t.FN, `\n${TAB}(`, cols.join(', '), ')', 'VALUES']

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
