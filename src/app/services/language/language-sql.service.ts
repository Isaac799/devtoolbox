import {Injectable} from '@angular/core'
import {Attribute, AttrType, GenerateDefaultValue, Lang, Table} from '../../structure'
import {cc, alignKeywords, alignKeyword} from '../../formatting'
import {TAB} from '../../constants'

@Injectable({
    providedIn: 'root'
})
export class LanguageSqlService {
    static generateAttributesForTable(t: Table, beingReferences?: Attribute) {
        let attrs: string[] = []
        for (const a of t.Attributes) {
            if (beingReferences) {
                if (!a.Option?.PrimaryKey) {
                    continue
                }
            }
            const name = beingReferences ? `${cc(beingReferences.Name, 'sk')}_${cc(a.Name, 'sk')}` : cc(a.Name, 'sk')
            let type = ''
            if ([AttrType.VARCHAR].includes(a.Type)) {
                let max = 15
                if (!a.Validation || !a.Validation.Max) {
                    console.warn(`missing max validation on "${name}"`)
                } else {
                    max = a.Validation.Max
                }
                type = [a.Type, `(${max || '15'})`].join('')
            } else if (a.Type === AttrType.REFERENCE) {
                if (beingReferences) {
                    // prevents endless recursion
                    continue
                }
                if (!a.RefTo) {
                    console.warn(`invalid referenced id "${name}"`)
                    continue
                }
                const referencedAttrs = LanguageSqlService.generateAttributesForTable(a.RefTo, a)
                attrs = attrs.concat(referencedAttrs)
                continue
            } else {
                type = a.Type
            }

            if (beingReferences && a.Type === AttrType.SERIAL) {
                type = 'INT'
            }

            const attrLine = [`${cc(name, 'sk')} ${type}`]

            if (a.Option?.Default) {
                const def = GenerateDefaultValue(a, Lang.PGSQL)
                if (def !== null) {
                    attrLine.push(`DEFAULT ${def}`)
                }
            }
            if (a.Validation?.Required) {
                attrLine.push(`NOT NULL`)
            }
            attrs.push(attrLine.join(' '))
        }

        attrs = alignKeywords(attrs, Object.values(AttrType))
        return attrs
    }

    static GenerateUniqueAttributes(t: Table): Record<string, string[]> {
        const uniques: Record<string, string[]> = {}
        for (const a of t.Attributes) {
            if (a.Option?.PrimaryKey) continue

            if (!a.Option?.Unique) {
                continue
            }

            for (const u of a.Option.Unique) {
                if (!uniques[u]) {
                    uniques[u] = []
                }
                uniques[u].push(a.Name)
            }
        }

        console.log(JSON.stringify(uniques, null, 4));
        
        return uniques
    }

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
