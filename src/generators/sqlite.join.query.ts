import {TAB} from '../app/constants'
import {cc, alignKeyword} from '../app/formatting'
import {Table, AttrType, Schema} from '../app/structure'
import {GenerateJoinLines, UseI} from './pgsql.functions'

export function SchemasToSQLiteJoinQuery(schemas: Schema[]): string {
    let lines: string[] = []
    for (const s of schemas) {
        for (const t of s.Tables) {
            const fns = generateSqlFns(t)
            if (!fns) continue
            lines = lines.concat(fns)
            lines.push('')
        }
    }

    const str = lines.join('\n')
    return str
}

function generateSqlFns(t: Table): string {
    if (!t.Parent) {
        return ''
    }

    let selectingLines: string[] = []

    const whereAND = []

    const useI = new UseI()
    useI.increment(t)

    let i = 0

    for (const a of t.Attributes) {
        if (!a.Option?.PrimaryKey || a.Type === AttrType.REFERENCE) continue
        i += 1
        whereAND.push(`${useI.get(t)}.${cc(a.Name, 'sk')} = ${cc(a.FN, 'up')}`)
    }

    if (i === 0) {
        return ''
    }

    const whereStr: string = whereAND.join(' AND ')

    for (const a of t.Attributes) {
        if (!a.RefTo) {
            const n = cc(a.FN, 'sk')
            selectingLines.push(`${useI.get(t)}.${cc(a.Name, 'sk')} AS ${n}`)
            continue
        }

        for (const ra of a.RefTo.Attributes) {
            const n = cc(a.FN, 'sk')
            selectingLines.push(`${useI.get(t)}.${cc(ra.Name, 'sk')} AS ${n}`)
        }
    }

    let joinLines: string[] = GenerateJoinLines(t, [], selectingLines, useI, true)

    joinLines = alignKeyword(joinLines, 'ON')
    joinLines = alignKeyword(joinLines, '=')
    selectingLines = alignKeyword(selectingLines, 'AS')

    const selecting = selectingLines.join(`,\n${TAB}`)
    const joinStr = joinLines.join(`\n${TAB}`)

    const q = `SELECT 
    ${selecting}
FROM
    ${joinStr}
WHERE
    ${whereStr}; -- replace with desired identifiers`

    return q
}
