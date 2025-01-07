import {TAB} from '../../constants'
import {cc, alignKeyword} from '../../formatting'
import {Table, AttrType, Schema, SQL_TO_TSQL_TYPE} from '../../structure'
import {GenerateJoinLines, UseI} from './pgsql.functions'

export function SchemasToTSQLStoredProcedures(schemas: Schema[]): string {
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

    const params: string[] = []
    const fnName = `${cc(t.Parent.Name, 'sk')}.${cc(`get_${t.Name}`, 'sk')}`
    let selectingLines: string[] = []

    const whereAND = []

    const useI = new UseI()
    useI.increment(t)

    for (const a of t.Attributes) {
        if (!a.Option?.PrimaryKey || a.Type === AttrType.REFERENCE) continue
        let type = SQL_TO_TSQL_TYPE[a.Type]

        if (a.Type === AttrType.SERIAL) {
            type = SQL_TO_TSQL_TYPE[AttrType.INT]
        }

        params.push(`@${cc(a.FN, 'sk')} ${type}`)
        whereAND.push(`${useI.get(t)}.${cc(a.Name, 'sk')} = @${cc(a.FN, 'sk')}`)
    }
    const whereStr: string = whereAND.join(' AND ')

    if (params.length === 0) {
        return ''
    }

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

    let joinLines: string[] = GenerateJoinLines(t, [], selectingLines, useI)

    joinLines = alignKeyword(joinLines, 'ON')
    joinLines = alignKeyword(joinLines, '=')
    selectingLines = alignKeyword(selectingLines, 'AS')

    const selecting = selectingLines.join(`,\n${TAB}${TAB}`)
    const paramsStr = params.join(', ')
    const joinStr = joinLines.join(`\n${TAB}${TAB}`)

    let q = `CREATE PROCEDURE ${fnName} ( ${paramsStr} ) 
    AS BEGIN
    SET NOCOUNT ON;
    SELECT 
        ${selecting}
    FROM
        ${joinStr}
    WHERE
        ${whereStr};
END; 
GO;`

    q = q.replaceAll('SERIAL', 'INT')

    return q
}
