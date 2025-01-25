import {TAB} from '../../constants'
import {cc, alignKeyword} from '../../formatting'
import {Table, AttrType, Schema} from '../../structure'

export class UseI {
    iUsages: Record<string, number> = {}

    increment = (t: Table, t2?: [Table, Table]): void => {
        const sameSchema = t2 ? t.Parent.ID === t2[0].Parent.ID : true

        const key = sameSchema && !t2 ? t.SimpleInitials : t2 ? `${t.SimpleInitials}${t2[0].SimpleInitials}Via${t2[1].SimpleInitials}` : t.FNInitials

        if (!this.iUsages[key]) {
            this.iUsages[key] = -1
        }
        this.iUsages[key] += 1
    }

    get = (t: Table, t2?: [Table, Table]): string => {
        const sameSchema = t2 ? t.Parent.ID === t2[0].Parent.ID : true

        const key = sameSchema && !t2 ? t.SimpleInitials : t2 ? `${t2[0].SimpleInitials}${t2[1].SimpleInitials}${t.SimpleInitials}` : t.FNInitials

        return key + (this.iUsages[key] || '')
    }
}

export function SchemasToSqlFuncs(schemas: Schema[]): string {
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

// CREATE OR REPLACE FUNCTION increment(i integer) RETURNS integer AS $$
//         BEGIN
//                 RETURN i + 1;
//         END;
// $$ LANGUAGE plpgsql;

function generateSqlFns(t: Table) {
    if (!t.Parent) {
        return ''
    }

    const params: string[] = []
    const fnName = `${cc(t.Parent.Name, 'sk')}.${cc(`get_${t.Name}`, 'sk')}`
    let selectingLines: string[] = []

    const useI = new UseI()
    useI.increment(t)

    const whereAND = []
    for (const a of t.Attributes) {
        if (!a.Option?.PrimaryKey || a.Type === AttrType.REFERENCE) continue
        params.push(`${cc(a.Name, 'sk')} ${a.Type}`)
        whereAND.push(`${useI.get(t)}.${cc(a.Name, 'sk')} = ${cc(a.Name, 'sk')}`)
    }
    const whereStr: string = whereAND.join(' AND ')

    if (params.length === 0) {
        return ''
    }

    const returnTableLines: string[] = []

    for (const a of t.Attributes) {
        if (!a.RefTo) {
            const n = cc(`${useI.get(t)}_${cc(a.Name, 'sk')}`, 'sk')
            returnTableLines.push(`${n} ${a.Type}`)
            selectingLines.push(`${useI.get(t)}.${cc(a.Name, 'sk')} AS ${n}`)
            continue
        }

        for (const ra of a.RefTo.Attributes) {
            const n = cc(`${useI.get(t)}_${cc(ra.Name, 'sk')}`, 'sk')
            returnTableLines.push(`${n} ${ra.Type}`)
            selectingLines.push(`${useI.get(t)}.${cc(ra.Name, 'sk')} AS ${n}`)
        }
    }

    let joinLines: string[] = GenerateJoinLines(t, returnTableLines, selectingLines, useI)

    joinLines = alignKeyword(joinLines, 'ON')
    joinLines = alignKeyword(joinLines, '=')
    selectingLines = alignKeyword(selectingLines, 'AS')

    const selecting = selectingLines.join(`,\n${TAB}${TAB}`)
    const returnTable = returnTableLines.join(`,\n${TAB}${TAB}`)
    const paramsStr = params.join(', ')
    const joinStr = joinLines.join(`\n${TAB}${TAB}`)

    let q = `CREATE OR REPLACE FUNCTION ${fnName} ( ${paramsStr} ) 
    RETURNS TABLE ( 
        ${returnTable}
    ) AS $$ BEGIN RETURN QUERY
    SELECT 
        ${selecting}
    FROM
        ${joinStr}
    WHERE
        ${whereStr};
    END; 
$$ LANGUAGE plpgsql;`

    q = q.replaceAll('SERIAL', 'INT')

    return q
}

export function GenerateJoinLines(t: Table, returnTableLines: string[], selectingLines: string[], useI: UseI, noSchemaMode = false) {
    const joinLines: string[] = []

    let s = `${t.FN} ${useI.get(t)}`
    if (noSchemaMode) {
        s = `${cc(t.FN, 'sk')} ${useI.get(t)}`
    }
    joinLines.push(s)

    if (t.RefBy) {
        for (const tbl of t.RefBy) {
            useI.increment(tbl)

            let l = tbl.FN
            if (noSchemaMode) {
                l = cc(l, 'sk')
            }
            const j1 = `LEFT JOIN ${l} ${useI.get(tbl)} ON`
            const j1ON = []

            for (const a2 of tbl.Attributes) {
                if (a2.Type === AttrType.REFERENCE && a2.RefTo) {
                    const pksForJoin = a2.RefTo.Attributes.filter(e => e.Option?.PrimaryKey && e.Type !== AttrType.REFERENCE)
                    for (const ra2 of pksForJoin) {
                        if (t.ID !== ra2.Parent.ID) continue
                        j1ON.push(`${useI.get(tbl)}.${cc(`${a2.Name}_${ra2.Name}`, 'sk')} = ${useI.get(t)}.${cc(ra2.Name, 'sk')}`)
                    }
                    continue
                }

                // let n =
                //   a2.Parent.Parent.ID === t.Parent.ID
                //     ? cc(a2.PFN, 's')
                //     : cc(a2.FN, 's');
                const n = cc(`${useI.get(tbl)}_${cc(a2.Name, 'sk')}`, 'sk')
                returnTableLines.push(`${n} ${a2.Type}`)
                selectingLines.push(`${useI.get(tbl)}.${cc(a2.Name, 'sk')} AS ${n}`)
            }

            if (j1ON.length > 0) {
                joinLines.push(`${j1} ${j1ON.join(' AND ')}`)
            } else {
                console.log('__')
                console.log('missing something\nj1 :>> ', j1)
                console.log('tbl.Attributes :>> ', tbl.Attributes)
                console.log(' ^ ^ ABOVE ^ ^ ')
            }

            for (const a of tbl.Attributes) {
                if (!a.RefTo) continue
                if (a.RefTo.ID === t.ID) continue

                const t2 = a.RefTo
                useI.increment(t2)

                let l = t2.FN
                if (noSchemaMode) {
                    l = cc(l, 'sk')
                }
                let j2 = `LEFT JOIN ${l} ${useI.get(t2, [t, tbl])} ON`
                const j2ON = []

                for (const a2 of t2.Attributes) {
                    if (a2.Type === AttrType.REFERENCE) continue

                    const n = cc(`${useI.get(t2, [t, tbl])}_${cc(a2.Name, 'sk')}`, 'sk')
                    returnTableLines.push(`${n} ${a2.Type}`)
                    selectingLines.push(`${useI.get(t2, [t, tbl])}.${cc(a2.Name, 'sk')} AS ${n}`)
                }

                for (const a2 of t2.Attributes) {
                    if (a2.Type === AttrType.REFERENCE) continue
                    if (!a2.Option?.PrimaryKey) continue

                    j2ON.push(`${useI.get(t2, [t, tbl])}.${cc(a2.Name, 'sk')} = ${useI.get(tbl)}.${cc(`${a.Name}_${a2.Name}`, 'sk')}`)
                }

                if (j2ON.length > 0) {
                    j2 += ` ${j2ON.join(' AND ')}`
                    joinLines.push(j2)
                }
            }
        }
    }
    return joinLines
}
