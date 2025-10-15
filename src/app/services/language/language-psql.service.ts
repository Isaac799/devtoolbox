import {Injectable} from '@angular/core'
import {TAB} from '../../../app/constants'
import {cc, alignKeyword, alignKeywords} from '../../../app/formatting'
import {Table, Schema, AttrType, PG_TO_PG_TYPE, Lang, GenerateDefaultValue, Attribute, DeterminedAttrDetails, Seed} from '../../../app/structure'
import {LanguageSqlService} from './language-sql.service'
import {AttributeMap} from '../../varchar'
import {MatSnackBar} from '@angular/material/snack-bar'

@Injectable({
    providedIn: 'root'
})
export class LanguagePsqlService {
    static ToTables(schemas: Schema[], creationsOnly = false, ifExists = false): string {
        let drops: string[] = []
        let createTableLines: string[] = []

        for (const s of schemas) {
            drops.push(`DROP SCHEMA ${ifExists ? 'IF EXISTS ' : ''}${cc(s.Name, 'sk')};`)
            createTableLines.push('')
            createTableLines.push(`CREATE SCHEMA ${ifExists ? 'IF NOT EXISTS ' : ''}${cc(s.Name, 'sk')};`)
            createTableLines.push('')
            for (const t of s.Tables) {
                drops.push(`DROP TABLE ${ifExists ? 'IF EXISTS ' : ''}${t.FN};`)
                const lines = LanguagePsqlService.GenerateTable(ifExists, t)
                createTableLines = createTableLines.concat(lines)
                // createTable  Lines = createTableLines.concat(indexes);
            }
        }
        drops = drops.reverse()
        if (creationsOnly) {
            drops = []
        }
        const all = ['', ...drops, '', ...createTableLines, '']
        const str = all.join('\n')
        return str
    }

    static GenerateTable(ifExists: boolean, t: Table) {
        const createTableLines: string[] = []

        createTableLines.push(`CREATE TABLE ${ifExists ? 'IF NOT EXISTS ' : ''}${t.FN} (`)
        const attrs: string[] = LanguagePsqlService.generateAttributesForTable(t)

        const endThings: string[] = LanguagePsqlService.generateTableEndParts(t)
        // let indexes: string[] = generateTableIndexes(t);
        if (attrs.length >= 1) {
            attrs[0] = `${TAB}${attrs[0]}`
        }
        createTableLines.push([...attrs, ...endThings].join(`,\n${TAB}`))

        createTableLines.push(');')

        return createTableLines
    }

    private static generateTableEndParts(t: Table) {
        let endThings: string[] = []

        const pks: string[] = t.AllPrimaryDeterminedIdentifiers()
        if (pks.length > 0) {
            const pksJoined = pks.join(', ')
            const pksStr = `PRIMARY KEY ( ${pksJoined} )`
            endThings.push(pksStr)
        }

        const uniques = t.DetermineUniqueAttributes()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [uniqueLabel, attrs] of Object.entries(uniques)) {
            const attrNames = attrs.map(e => e[0]).join(', ')
            const uniquesStr = `UNIQUE ( ${attrNames} )`
            endThings.push(uniquesStr)
        }

        const allAttrs = t.AllAttributes()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [determinedKey, [calledFrom, a, isPk, isFk, validation, options]] of Object.entries(allAttrs)) {
            const srcA = calledFrom[calledFrom.length - 1]
            if (!srcA) continue

            const distant = srcA && srcA?.Parent.ID !== t.ID
            const nested = srcA && srcA.RefTo && a.Option?.PrimaryKey
            if (distant && !nested) continue

            const parent = distant ? srcA.Parent.FN : a.Parent.FN
            const rStr = `FOREIGN KEY ( ${determinedKey} ) REFERENCES ${parent} ( ${cc(a.Name, 'sk')} ) ON DELETE CASCADE`
            endThings.push(rStr)
        }
        endThings = alignKeyword(endThings, '(')
        endThings = alignKeyword(endThings, 'REFERENCES')
        endThings = alignKeyword(endThings, 'ON DELETE CASCADE')
        return endThings
    }

    static ToSeed(schemas: Schema[], map: AttributeMap, limit: number, snackBar: MatSnackBar): string {
        const lines: string[] = []

        for (const s of schemas) {
            lines.push('')
            for (const t of s.Tables) {
                let values: string[] = []
                const alignmentKeyword = `~|~|~`
                let columns: string[] = []
                let divider: string[] = []

                const allAttrs = t.AllAttributes()
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for (const [determinedKey, [calledFrom, a, isPk, isFk, validation, options]] of Object.entries(allAttrs)) {
                    columns.push(determinedKey)
                    divider.push('-'.repeat(determinedKey.length))
                }

                const c = `\n${TAB}( ${columns.join(`,${alignmentKeyword} `)} ) VALUES~~`
                const c2 = `\n${TAB}  ${divider.join(` ${alignmentKeyword} `)}`
                values.push(c)
                values.push()
                values.push(c2)
                columns = []
                divider = []

                const seed = new Seed(t, map, limit)
                if (seed.brokeUnique) {
                    snackBar.open('Results limited', '', {
                        duration: 2000
                    })
                }
                const data = seed.seedTable.Read()
                for (const row of data) {
                    const c = `\n${TAB}( ${row.join(`,${alignmentKeyword} `)} )`
                    values.push(c)
                }

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for (const [determinedKey, [calledFrom, a, isPk, isFk, validation, options]] of Object.entries(allAttrs)) {
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
        const str = lines.join('\n').replaceAll('VALUES~~,', 'VALUES')

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

    static generateAttributesForTable(t: Table) {
        let attrs: string[] = []

        const allAttrs = t.AllAttributes()
        for (const [determinedKey, [calledFrom, a, isPk, isFk, validation, options]] of Object.entries(allAttrs)) {
            const srcA = calledFrom[calledFrom.length - 1]
            const distant = srcA && srcA?.Parent.ID !== t.ID
            const nested = srcA && srcA.RefTo && a.Option?.PrimaryKey
            // console.log('edge :>> ', edge);
            // console.log('t.FN :>> ', t.FN);
            // console.log('srcA :>> ', srcA , " -> ", a);

            if (distant && !nested) continue

            const attrLine = LanguagePsqlService.generateAttrLine(determinedKey, [[srcA], a, isPk, isFk, validation, options])
            attrs.push(attrLine)
        }

        attrs = alignKeywords(attrs, Object.values(AttrType))
        return attrs
    }

    static generateAttrLine(determinedKey: string, details: DeterminedAttrDetails | Attribute) {
        if (details instanceof Attribute) {
            const name = cc(determinedKey, 'sk')
            let type = ''
            const a = details
            if (a.isStr()) {
                type = a.VarcharType()
            } else {
                type = PG_TO_PG_TYPE[a.Type]
            }

            if (a.Type === AttrType.SERIAL) {
                type = 'INT'
            }

            const attrLine = [`${cc(name, 'sk')} ${type}`]

            if (a.Option?.Default !== undefined) {
                const def = GenerateDefaultValue(a, Lang.PGSQL)
                if (def !== null) {
                    attrLine.push(`DEFAULT ${def}`)
                }
            }
            if (a.Validation?.Required === true) {
                attrLine.push(`NOT NULL`)
            }
            return attrLine.join(' ')
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [calledFrom, a, isPk, isFk, validation, options] = details
        const name = cc(determinedKey, 'sk')
        let type = ''
        if (a.isStr()) {
            type = a.VarcharType()
        } else {
            type = PG_TO_PG_TYPE[a.Type]
        }

        if (a.Type === AttrType.SERIAL) {
            type = 'INT'
        }

        const attrLine = [`${cc(name, 'sk')} ${type}`]

        if (options?.Default !== undefined) {
            const def = GenerateDefaultValue(a, Lang.PGSQL)
            if (def !== null) {
                attrLine.push(`DEFAULT ${def}`)
            }
        }
        if (validation?.Required === true) {
            attrLine.push(`NOT NULL`)
        }
        return attrLine.join(' ')
    }
}
