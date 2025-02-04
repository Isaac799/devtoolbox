import {Injectable} from '@angular/core'
import {TAB} from '../../../app/constants'
import {cc, alignKeyword, alignKeywords} from '../../../app/formatting'
import {Table, Schema, AttrType, generateSeedData, PG_TO_PG_TYPE, Lang, GenerateDefaultValue, Attribute} from '../../../app/structure'
import {LanguageSqlService} from './language-sql.service'
import {AttributeMap} from '../../varchar'

@Injectable({
    providedIn: 'root'
})
export class LanguagePsqlService {
    static ToTables(schemas: Schema[]): string {
        let drops: string[] = []
        const createTableLines: string[] = []

        for (const s of schemas) {
            drops.push(`DROP SCHEMA IF EXISTS ${cc(s.Name, 'sk')};`)
            createTableLines.push('')
            createTableLines.push(`CREATE SCHEMA IF NOT EXISTS ${cc(s.Name, 'sk')};`)
            createTableLines.push('')
            for (const t of s.Tables) {
                drops.push(`DROP TABLE IF EXISTS ${t.FN};`)
                createTableLines.push(`CREATE TABLE IF NOT EXISTS ${t.FN} (`)
                const attrs: string[] = LanguagePsqlService.generateAttributesForTable(t)

                const endThings: string[] = LanguagePsqlService.generateTableEndParts(t)
                // let indexes: string[] = generateTableIndexes(t);

                if (attrs.length >= 1) {
                    attrs[0] = `${TAB}${attrs[0]}`
                }
                createTableLines.push([...attrs, ...endThings].join(`,\n${TAB}`))

                createTableLines.push(');')

                // createTableLines = createTableLines.concat(indexes);
            }
        }
        drops = drops.reverse()
        const all = ['BEGIN;', '', '-- Drop Everything', '', ...drops, '', '-- Create Everything', ...createTableLines, '', 'COMMIT;']
        const str = all.join('\n')
        return str
    }

    private static generateTableEndParts(t: Table) {
        let endThings: string[] = []

        const pks: string[] = []

        for (const a of t.Attributes) {
            if (!a.Option?.PrimaryKey) continue
            if (!a.RefTo) {
                pks.push(cc(a.Name, 'sk'))
                continue
            }

            for (const ra of a.RefTo.Attributes) {
                if (!ra.Option?.PrimaryKey) continue
                pks.push(cc(`${a.Name}_${ra.Name}`, 'sk'))
            }
        }

        if (pks.length > 0) {
            const pksJoined = pks.join(', ')
            const pksStr = `PRIMARY KEY ( ${pksJoined} )`
            endThings.push(pksStr)
        }

        const uniques = LanguageSqlService.GenerateUniqueAttributes(t)
        for (const label in uniques) {
            const attrNames = uniques[label].map(e => cc(e, 'sk')).join(', ')
            const uniquesStr = `UNIQUE ( ${attrNames} )`
            endThings.push(uniquesStr)
        }

        const refs = t.Attributes.filter(e => e.RefTo)
        if (refs.length > 0) {
            for (const e of refs) {
                const r = e.RefTo!
                const rPks = r.Attributes.filter(e => e.Option?.PrimaryKey)
                for (const rPk of rPks) {
                    const rStr = `FOREIGN KEY ( ${cc(e.Name, 'sk')}_${cc(rPk.Name, 'sk')} ) REFERENCES ${r.FN} ( ${cc(rPk.Name, 'sk')} ) ON DELETE CASCADE`
                    endThings.push(rStr)
                }
            }
        }

        endThings = alignKeyword(endThings, '(')
        return endThings
    }

    // function generateTableIndexes(t: Table) {
    //   let endThings: string[] = [];

    //   let refs = t.Attributes.filter((e) => e.RefTo);
    //   if (refs.length > 0) {
    //     for (const e of refs) {
    //       let r = e.RefTo!;
    //       let rPks = r.Attributes.filter((e) => e.Option?.PrimaryKey);
    //       for (const rPk of rPks) {
    //         if (rPk.Option?.PrimaryKey) continue;
    //         let rStr = `CREATE INDEX  ${convertCase(
    //           `idx_${AttributeNameWithSchemaAndTable(rPk)}`,
    //           'snake'
    //         )} ON ${TableFullName(r)} ( ${convertCase(rPk.Name, 'snake')} );`;
    //         endThings.push(rStr);
    //       }
    //     }
    //   }

    //   endThings = alignKeyword(endThings, 'ON');
    //   return endThings;
    // }

    private static genRandomRef(max: number): number {
        return Math.floor(Math.random() * max) + 1
    }

    static ToSeed(schemas: Schema[], map: AttributeMap, limit: number): string {
        const lines: string[] = []

        const tGenCount: Record<string, number> = {}

        const usedMap: Record<string, string[]> = {}

        const tblRows: Record<string, number> = {}

        for (const s of schemas) {
            lines.push('')
            for (const t of s.Tables) {
                if (!t.Attributes.length) {
                    continue
                }
                let values: string[] = []
                const alignmentKeyword = `~|~|~`

                let v2: string[] = []
                let v3: string[] = []
                for (const a of t.Attributes) {
                    v2.push(cc(a.Name, 'sk'))
                    v3.push('-'.repeat(cc(a.Name, 'sk').length))
                }

                const c = `\n${TAB}( ${v2.join(`,${alignmentKeyword} `)} ) VALUES~~`
                const c2 = `\n${TAB}  ${v3.join(` ${alignmentKeyword} `)}`
                values.push(c)
                values.push()
                values.push(c2)
                v2 = []
                v3 = []

                if (tblRows[t.FN] === undefined) {
                    tblRows[t.FN] = 0
                }

                let u = false

                adding: for (let index = 0; index < limit; index++) {
                    for (const a of t.Attributes) {
                        // u = a.Option?.Unique || a.Option?.PrimaryKey || false

                        if (a.Type === AttrType.SERIAL) {
                            u = false
                        }

                        // for (let j = 0; j < 4; j++) {

                        if (!u) {
                            let v = ''
                            if (a.Type === AttrType.REFERENCE && a.RefTo) {
                                v = LanguagePsqlService.genRandomRef(tblRows[a.RefTo.FN]) + ''
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
                                    v = LanguagePsqlService.genRandomRef(tblRows[a.RefTo.FN]) + ''
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

                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let index = 0; index < t.Attributes.length; index++) {
                    values = alignKeyword(values, alignmentKeyword)
                    values = values.map(e => e.replace(alignmentKeyword, ''))
                }
                const stmt: string[] = ['INSERT INTO', t.FN]

                const lineParts = [stmt.join(' '), values, ';']

                const line: string = lineParts.join(' ')
                lines.push(line)
                lines.push('')
            }
        }
        const all = ['BEGIN;', '', ...lines, '', 'COMMIT;']
        const str = all.join('\n').replaceAll('VALUES~~,', 'VALUES')

        return str
    }

    static ToFunctions(schemas: Schema[]): string {
        let lines: string[] = []
        for (const s of schemas) {
            for (const t of s.Tables) {
                const fns = LanguagePsqlService.generateSqlFns(t)
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

    private static generateSqlFns(t: Table) {
        if (!t.Parent) {
            return ''
        }

        const params: string[] = []
        const fnName = `${cc(t.Parent.Name, 'sk')}.${cc(`get_${t.Name}`, 'sk')}`
        let selectingLines: string[] = []

        const useI = LanguageSqlService.NewTableTracker()
        useI.increment(t, null)

        const whereAND = []
        for (const a of t.Attributes) {
            if (!a.Option?.PrimaryKey || a.Type === AttrType.REFERENCE) continue
            params.push(`desired_${cc(a.Name, 'sk')} ${PG_TO_PG_TYPE[a.Type]}`)
            whereAND.push(`${useI.get(t, null)}.${cc(a.Name, 'sk')} = desired_${cc(a.Name, 'sk')}`)
        }
        const whereStr: string = whereAND.join(' AND ')

        if (params.length === 0) {
            return ''
        }

        const returnTableLines: string[] = []

        for (const a of t.Attributes) {
            if (!a.RefTo) {
                const n = cc(`${useI.get(t, a)}_${cc(a.Name, 'sk')}`, 'sk')
                returnTableLines.push(`${n} ${PG_TO_PG_TYPE[a.Type]}`)
                selectingLines.push(`${useI.get(t, a)}.${cc(a.Name, 'sk')} AS ${n}`)
                continue
            }

            for (const ra of a.RefTo.Attributes) {
                const n = cc(`${useI.get(t, a)}_${cc(ra.Name, 'sk')}`, 'sk')
                returnTableLines.push(`${n} ${PG_TO_PG_TYPE[ra.Type]}`)
                selectingLines.push(`${useI.get(t, a)}.${cc(ra.Name, 'sk')} AS ${n}`)
            }
        }

        let joinLines: string[] = LanguageSqlService.GenerateJoinLines(t, returnTableLines, selectingLines, useI)

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
                const referencedAttrs = LanguagePsqlService.generateAttributesForTable(a.RefTo, a)
                attrs = attrs.concat(referencedAttrs)
                continue
            } else {
                type = PG_TO_PG_TYPE[a.Type]
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
}
