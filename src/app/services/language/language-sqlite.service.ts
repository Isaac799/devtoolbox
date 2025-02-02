import {Injectable} from '@angular/core'
import {LanguageSqlService} from './language-sql.service'
import {AttrType, GenerateDefaultValue, Attribute, Lang, Schema, SQL_TO_SQL_LITE_TYPE, Table} from '../../structure'
import {TAB} from '../../constants'
import {cc, alignKeyword, alignKeywords} from '../../formatting'

@Injectable({
    providedIn: 'root'
})
export class LanguageSqliteService {
    static ToJoinQuery(schemas: Schema[]): string {
        let lines: string[] = []
        for (const s of schemas) {
            for (const t of s.Tables) {
                const fns = LanguageSqlService.generateSqlFns(t)
                if (!fns) continue
                lines = lines.concat(fns)
                lines.push('')
            }
        }

        const str = lines.join('\n')
        return str
    }

    static ToTables(schemas: Schema[]): string {
        let drops: string[] = []
        const createTableLines: string[] = []
        for (const s of schemas) {
            for (const t of s.Tables) {
                drops.push(`DROP TABLE IF EXISTS ${cc(t.FN, 'sk')};`)
                createTableLines.push(`\nCREATE TABLE IF NOT EXISTS ${cc(t.FN, 'sk')} (`)
                const attrs: string[] = LanguageSqliteService.generateAttributesForTable(t)

                const endThings: string[] = LanguageSqliteService.generateTableEndParts(t)
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
                    const rStr = `FOREIGN KEY ( ${cc(e.Name, 'sk')}_${cc(rPk.Name, 'sk')} ) REFERENCES ${cc(r.FN, 'sk')} ( ${cc(
                        rPk.Name,
                        'sk'
                    )} ) ON DELETE CASCADE`
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
            if (a.Type === AttrType.REFERENCE) {
                if (beingReferences) {
                    // prevents endless recursion
                    continue
                }
                if (!a.RefTo) {
                    console.warn(`invalid referenced id "${name}"`)
                    continue
                }
                const referencedAttrs = LanguageSqliteService.generateAttributesForTable(a.RefTo, a)
                attrs = attrs.concat(referencedAttrs)
                continue
            } else {
                type = SQL_TO_SQL_LITE_TYPE[a.Type]
            }

            if (beingReferences && a.Type === AttrType.SERIAL) {
                type = 'INT'
            }

            const attrLine = [`${cc(name, 'sk')} ${type}`]

            if (a.Option?.Default) {
                const def = GenerateDefaultValue(a, Lang.SQLite)
                if (def !== null) {
                    attrLine.push(`DEFAULT ${def}`)
                }
            }
            if (a.Validation?.Required) {
                attrLine.push(`NOT NULL`)
            }
            attrs.push(attrLine.join(' '))
        }

        attrs = alignKeywords(attrs, Object.values(SQL_TO_SQL_LITE_TYPE))
        return attrs
    }
}
