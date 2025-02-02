import {Injectable} from '@angular/core'
import {Schema, Table, Attribute, ParseResult, AttributeConfig, AttrType, SchemaConfig} from '../structure'

@Injectable({
    providedIn: 'root'
})
export class DataService {
    schemas: Schema[] = []
    previousParse: ParseResult | null = null

    getReference(id: string): Table | null {
        for (const s of this.schemas) {
            for (const t of s.Tables) {
                if (t.ID !== id) {
                    continue
                }
                return t
            }
        }
        return null
    }

    getPrimaryKeys(table: Table): Attribute[] {
        return table.Attributes.filter(e => e.Option?.PrimaryKey)
    }

    static ParseSchemaConfig(schemasConfig: Record<string, SchemaConfig>) {
        const schemas: Schema[] = []
        let allTables: Table[] = []

        const recheckAttrs: AttributeConfig[] = []

        for (const sk in schemasConfig) {
            if (!Object.prototype.hasOwnProperty.call(schemasConfig, sk)) {
                continue
            }
            const s = schemasConfig[sk]
            const s2 = new Schema(s.ID, sk, s.Color)

            for (const tk in s.Tables) {
                if (!Object.prototype.hasOwnProperty.call(s.Tables, tk)) {
                    continue
                }
                const t = s.Tables[tk]
                const t2p = [s2, ...schemas].find(e => e.ID === s.ID)
                if (!t2p) continue

                const t2 = new Table(t.ID, tk, t2p, t.dragPosition)

                for (const ak in t.Attributes) {
                    if (!Object.prototype.hasOwnProperty.call(t.Attributes, ak)) {
                        continue
                    }
                    const a = t.Attributes[ak]
                    const a2p = [t2, ...s2.Tables, ...allTables].find(e => e.ID === t.ID)
                    const r2 = [t2, ...s2.Tables, ...allTables].find(e => e.ID === a.RefToID)
                    if (!a2p) {
                        continue
                    }
                    const a2 = new Attribute(a.ID, ak, a.Type, a2p)

                    if (r2) {
                        if (!r2.RefBy) {
                            r2.RefBy = []
                        }
                        // console.log(r2.Name, ' is ref by ', t2.Name);
                        r2.RefBy.push({
                            tlb: t2,
                            attr: a2
                        })
                    }

                    if (!r2 && a2.Type === AttrType.REFERENCE) {
                        recheckAttrs.push(a)
                    }

                    if (r2) {
                        a2.RefTo = r2
                    }
                    if (a.Option) {
                        a2.Option = a.Option
                    }
                    if (a.Validation) {
                        a2.Validation = a.Validation
                    }

                    if (a2.Type === AttrType.SERIAL) {
                        if (!a2.Option) {
                            a2.Option = {}
                        }
                        a2.Option.PrimaryKey = true
                        a2.Option.SystemField = true

                        if (!a2.Validation) {
                            a2.Validation = {}
                        }
                        a2.Validation.Required = true
                    }

                    t2.Attributes.push(a2)
                }
                allTables.push(t2)
                s2.Tables.push(t2)
            }
            schemas.push(s2)
        }

        DataService.CheckForBadReferences(recheckAttrs, allTables, schemas)

        allTables = []
        return schemas
    }

    private static CheckForBadReferences(recheckAttrs: AttributeConfig[], allTables: Table[], schemas: Schema[]) {
        for (const a of recheckAttrs) {
            const r = allTables.find(e => e.ID === a.RefToID)

            let realAttr: Attribute | null = null

            search: for (const s of schemas) {
                for (const t of s.Tables) {
                    for (const atr of t.Attributes) {
                        if (atr.ID !== a.ID) {
                            continue
                        }
                        realAttr = atr
                        break search
                    }
                }
            }

            if (!realAttr) {
                continue
            }

            if (realAttr.Type === AttrType.REFERENCE && !r) {
                realAttr.warnings.push(`failed to find reference`)
            } else if (!r) {
                realAttr.warnings.push(`reference to does not exist`)
            } else {
                realAttr.RefTo = r
                const index = realAttr.RefTo.Parent.Tables.findIndex(e => e.ID === realAttr.RefTo!.ID)
                const rm = realAttr.RefTo.Parent.Tables.splice(index, 1)
                realAttr.RefTo.Parent.Tables.unshift(rm[0])
            }
        }
    }
}
