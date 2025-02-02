import {Injectable} from '@angular/core'
import {TAB} from '../../../app/constants'
import {cc, alignKeyword, alignKeywords} from '../../../app/formatting'
import {Table, AttrType, Schema, SQL_TO_TSQL_TYPE, Attribute, GenerateDefaultValue, Lang} from '../../../app/structure'
import {LanguageSqlService} from './language-sql.service'

@Injectable({
    providedIn: 'root'
})
export class LanguageTsqlService {
    static ToStoredProcedures(schemas: Schema[]): string {
        let lines: string[] = []
        for (const s of schemas) {
            for (const t of s.Tables) {
                const fns = LanguageTsqlService.generateSqlFns(t)
                if (!fns) continue
                lines = lines.concat(fns)
                lines.push('')
            }
        }

        const str = lines.join('\n')
        return str
    }

    private static generateSqlFns(t: Table): string {
        if (!t.Parent) {
            return ''
        }

        const params: string[] = []
        const fnName = `${cc(t.Parent.Name, 'sk')}.${cc(`get_${t.Name}`, 'sk')}`
        let selectingLines: string[] = []

        const whereAND = []

        const useI = LanguageSqlService.NewTableTracker()
        useI.increment(t, null)

        for (const a of t.Attributes) {
            if (!a.Option?.PrimaryKey || a.Type === AttrType.REFERENCE) continue
            let type = SQL_TO_TSQL_TYPE[a.Type]

            if (a.Type === AttrType.SERIAL) {
                type = SQL_TO_TSQL_TYPE[AttrType.INT]
            }

            params.push(`@${cc(a.FN, 'sk')} ${type}`)
            whereAND.push(`${useI.get(t, a)}.${cc(a.Name, 'sk')} = @${cc(a.FN, 'sk')}`)
        }
        const whereStr: string = whereAND.join(' AND ')

        if (params.length === 0) {
            return ''
        }

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

        let joinLines: string[] = LanguageSqlService.GenerateJoinLines(t, [], selectingLines, useI)

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

    static ToTables(schemas: Schema[]): string {
        let drops: string[] = []
        const createTableLines: string[] = []
        for (const s of schemas) {
            drops.push(
                `IF EXISTS (SELECT * FROM sys.schemas WHERE name = '${cc(s.Name, 'sk')}') 
  DROP SCHEMA ${cc(s.Name, 'sk')};`
            )
            createTableLines.push('')
            createTableLines.push(
                `IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${cc(s.Name, 'sk')}') 
  CREATE SCHEMA ${cc(s.Name, 'sk')};`
            )
            createTableLines.push('')
            for (const t of s.Tables) {
                drops.push(
                    `IF OBJECT_ID('${cc(t.Name, 'sk')}', 'U') IS NOT NULL 
  DROP TABLE ${t.FN};`
                )
                createTableLines.push(`CREATE TABLE ${t.FN} (`)
                const attrs: string[] = LanguageTsqlService.generateAttributesForTable(t)

                const endThings: string[] = LanguageTsqlService.generateTableEndParts(t)
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
        const all = ['BEGIN TRANSACTION;', '', '-- Drop Everything', '', ...drops, '', '-- Create Everything', ...createTableLines, '', 'COMMIT;']
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

    private static generateAttributesForTable(t: Table, beingReferences?: Attribute) {
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
                type = [SQL_TO_TSQL_TYPE[a.Type], `(${max || '15'})`].join('')
            } else if (a.Type === AttrType.REFERENCE) {
                if (beingReferences) {
                    // prevents endless recursion
                    continue
                }
                if (!a.RefTo) {
                    console.warn(`invalid referenced id "${name}"`)
                    continue
                }
                const referencedAttrs = LanguageTsqlService.generateAttributesForTable(a.RefTo, a)
                attrs = attrs.concat(referencedAttrs)
                continue
            } else {
                type = SQL_TO_TSQL_TYPE[a.Type]
            }

            if (beingReferences && a.Type === AttrType.SERIAL) {
                type = 'INT'
            }

            const attrLine = [`${cc(name, 'sk')} ${type}`]

            if (a.Option?.Default) {
                const def = GenerateDefaultValue(a, Lang.TSQL)
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
