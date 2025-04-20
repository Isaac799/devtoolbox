import {Injectable} from '@angular/core'
import {Attribute, AttrType, DeterminedAttrDetails, DeterminedAttrDetailsWithLabel, Table} from '../../structure'
import {cc, alignKeyword} from '../../formatting'
import {TAB} from '../../constants'

@Injectable({
    providedIn: 'root'
})
export class LanguageSqlService {
    static GenerateJoinLines(t: Table, returnTableLines: string[], selectingLines: string[], useI: UseI, noSchemaMode = false) {
        const joinLines: string[] = []

        let s = `${t.FN} ${useI.get(t, null)}`
        if (noSchemaMode) {
            s = `${cc(t.FN, 'sk')} ${useI.get(t, null)}`
        }
        joinLines.push(s)

        if (t.RefBy) {
            for (const tbl of t.RefBy) {
                useI.increment(tbl.tlb, null)

                let l = tbl.attr.FN
                if (noSchemaMode) {
                    l = cc(l, 'sk')
                }
                const j1 = `LEFT JOIN ${l} ${useI.get(tbl.tlb, tbl.attr)} ON`
                const j1ON = []

                for (const a2 of tbl.tlb.Attributes) {
                    if (a2.Type === AttrType.REFERENCE && a2.RefTo) {
                        const pksForJoin = a2.RefTo.Attributes.filter(e => e.Option?.PrimaryKey && e.Type !== AttrType.REFERENCE)
                        for (const ra2 of pksForJoin) {
                            if (t.ID !== ra2.Parent.ID) continue
                            j1ON.push(`${useI.get(tbl.tlb, tbl.attr)}.${cc(`${a2.Name}_${ra2.Name}`, 'sk')} = ${useI.get(t, tbl.attr)}.${cc(ra2.Name, 'sk')}`)
                        }
                        continue
                    }

                    // let n =
                    //   a2.Parent.Parent.ID === t.Parent.ID
                    //     ? cc(a2.PFN, 's')
                    //     : cc(a2.FN, 's');
                    const n = cc(`${tbl.attr.Name}_${useI.get(tbl.tlb, tbl.attr)}_${cc(a2.Name, 'sk')}`, 'sk')

                    returnTableLines.push(`${n} ${a2.Type}`)
                    selectingLines.push(`${useI.get(tbl.tlb, tbl.attr)}.${cc(a2.Name, 'sk')} AS ${n}`)
                }

                if (j1ON.length > 0) {
                    joinLines.push(`${j1} ${j1ON.join(' AND ')}`)
                } else {
                    console.log('__')
                    console.log('missing something\nj1 :>> ', j1)
                    console.log('tbl.Attributes :>> ', tbl.tlb.Attributes)
                    console.log(' ^ ^ ABOVE ^ ^ ')
                }

                for (const a of tbl.tlb.Attributes) {
                    if (!a.RefTo) continue
                    if (a.RefTo.ID === t.ID) continue

                    const t2 = a.RefTo
                    useI.increment(t2, null)

                    let l = t2.FN
                    if (noSchemaMode) {
                        l = cc(l, 'sk')
                    }
                    let j2 = `LEFT JOIN ${l} ${useI.get(t2, tbl.attr, [t, tbl.tlb])} ON`
                    const j2ON = []

                    for (const a2 of t2.Attributes) {
                        if (a2.Type === AttrType.REFERENCE) continue

                        const n = cc(`${tbl.attr.Name}_${useI.get(t2, tbl.attr, [t, tbl.tlb])}_${cc(a2.Name, 'sk')}`, 'sk')
                        returnTableLines.push(`${n} ${a2.Type}`)
                        selectingLines.push(`${useI.get(t2, tbl.attr, [t, tbl.tlb])}.${cc(a2.Name, 'sk')} AS ${n}`)
                    }

                    for (const a2 of t2.Attributes) {
                        if (a2.Type === AttrType.REFERENCE) continue
                        if (!a2.Option?.PrimaryKey) continue

                        j2ON.push(
                            `${useI.get(t2, tbl.attr, [t, tbl.tlb])}.${cc(a2.Name, 'sk')} = ${useI.get(tbl.tlb, tbl.attr)}.${cc(`${a.Name}_${a2.Name}`, 'sk')}`
                        )
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

    static NewTableTracker() {
        return new UseI()
    }

    static generateSqlFns(t: Table): string {
        if (!t.Parent) {
            return ''
        }

        let selectingLines: string[] = []

        const whereAND = []

        const useI = new UseI()
        useI.increment(t, null)

        let i = 0

        for (const a of t.Attributes) {
            if (!a.Option?.PrimaryKey || a.Type === AttrType.REFERENCE) continue
            i += 1
            whereAND.push(`${useI.get(t, a)}.${cc(a.Name, 'sk')} = ${cc(a.FN, 'up')}`)
        }

        if (i === 0) {
            return ''
        }

        const whereStr: string = whereAND.join(' AND ')

        for (const a of t.Attributes) {
            if (!a.RefTo) {
                const n = cc(a.FN, 'sk')
                selectingLines.push(`${useI.get(t, a)}.${cc(a.Name, 'sk')} AS ${n}`)
                continue
            }

            for (const ra of a.RefTo.Attributes) {
                const n = cc(a.FN, 'sk')
                selectingLines.push(`${useI.get(t, a)}.${cc(ra.Name, 'sk')} AS ${n}`)
            }
        }

        let joinLines: string[] = LanguageSqlService.GenerateJoinLines(t, [], selectingLines, useI, true)

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

    static FormatQuery(s: string) {
        // console.log("-----------------")
        // console.log(s)
        s = s.replace('ORDER BY', 'ORDER_BY')
        s = s.replace('GROUP BY', 'GROUP_BY')
        const words = s.trim().split(' ')
        let answer = ''
        const {newlinePool, sameLinePool} = LanguageSqlService.generateKeywordPools()
        while (words.length > 0) {
            let w = words.shift()
            if (w && !newlinePool.includes(w) && !sameLinePool.includes(w)) {
                // console.log('w0 :>> ', w)
                answer += ` ${w} `
                continue
            }
            let addedSameLine = false
            while (w && sameLinePool.includes(w)) {
                const l = []
                // console.log('w1 :>> ', w)
                l.push(` ${w} `)
                w = words.shift()
                if (w && !sameLinePool.includes(w)) {
                    // console.log('w2 :>> ', w)

                    const willAddInNewLine = newlinePool.includes(w)

                    if (!willAddInNewLine) {
                        l.push(w)
                    }

                    addedSameLine = true
                    answer += l.join(' ')

                    if (willAddInNewLine) {
                        answer += `\n${w}`
                    }

                    break
                }
            }
            if (addedSameLine) {
                w = words.shift()
            }
            let addedNewLine = false
            while (w && newlinePool.includes(w)) {
                const l = []
                // console.log('w3 :>> ', w)
                l.push(`\n${w}`)
                w = words.shift()
                if (w && !newlinePool.includes(w)) {
                    // console.log('w4 :>> ', w)
                    l.push(w)
                    answer += l.join(' ')
                    addedNewLine = true
                    break
                }
            }
            if (w && addedSameLine && !addedNewLine) {
                // console.log('w5 :>> ', w)
                answer += ` ${w} `
            }
        }

        let final = `\n${answer.trim().replaceAll('  ', ' ')}\n`
        final = final.replace('ORDER_BY', 'ORDER BY')
        final = final.replace('GROUP_BY', 'GROUP BY')
        // console.log(final)
        return final
    }

    private static generateKeywordPools() {
        const newlineKeywords = ['SELECT', 'UPDATE', 'VALUES', 'WHERE', 'FROM', 'ORDER_BY', 'LIMIT', 'SET', 'RETURNING']
        const samelineKeywords = ['GROUP_BY', 'ASC', 'DESC', 'DELETE', 'OFFSET', 'AND', 'OR']
        const newlinePool = []
        const sameLinePool = []
        for (const k of newlineKeywords) {
            newlinePool.push(k)
            newlinePool.push(k + ',')
        }
        for (const k of samelineKeywords) {
            sameLinePool.push(k)
            sameLinePool.push(k + ',')
        }
        return {newlinePool, sameLinePool}
    }
}

class UseI {
    iUsages: Record<string, number> = {}

    increment = (t: Table, a: Attribute | null, t2?: [Table, Table]): void => {
        const sameSchema = t2 ? t.Parent.ID === t2[0].Parent.ID : true

        const key =
            a && t2
                ? `${a.Name}${t2[0].SimpleInitials}${t2[1].SimpleInitials}`
                : a && sameSchema && !t2
                ? `${a.Name}`
                : sameSchema && !t2
                ? t.SimpleInitials
                : t2
                ? `${t.SimpleInitials}${t2[0].SimpleInitials}${t2[1].SimpleInitials}`
                : t.FNInitials

        if (this.iUsages[key] === undefined) {
            this.iUsages[key] = -1
        }
        this.iUsages[key] += 1
    }

    get = (t: Table, a: Attribute | null, t2?: [Table, Table]): string => {
        const sameSchema = t2 ? t.Parent.ID === t2[0].Parent.ID : true
        const key =
            a && t2
                ? `${a.Name}${t2[0].SimpleInitials}${t2[1].SimpleInitials}`
                : a && sameSchema && !t2
                ? `${a.Name}`
                : sameSchema && !t2
                ? t.SimpleInitials
                : t2
                ? `${t.SimpleInitials}${t2[0].SimpleInitials}${t2[1].SimpleInitials}`
                : t.FNInitials

        return key + (this.iUsages[key] || '')
    }
}
