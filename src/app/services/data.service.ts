import {Injectable} from '@angular/core'
import {Schema, App, AppComplexityMode, AppGeneratorMode, AppMode, Table, Attribute, SchemaConfig, TableConfig, AttributeConfig, AttrType} from '../structure'
import {Subject} from 'rxjs'
import {defaultConfig} from '../constants'
import {AttributeMap, generateAttributeMap, VarcharJSONData} from '../varchar'
import varcharJSON from '../../../public/varchar.json'

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private readonly stateSessionKey = 'devtoolboxState'
    private readonly configSessionKey = 'devtoolboxAppConfig'
    private initialized = false

    editor = ''
    schemas: Schema[] = []
    varcharMap: AttributeMap = new Map()
    schemasConfig: Record<string, SchemaConfig> = {}
    schemasChange = new Subject<Schema[]>()
    schemasConfigChange = new Subject<Record<string, SchemaConfig>>()

    constructor() {
        let all: VarcharJSONData = {}
        for (const e of Object.values(varcharJSON)) {
            all = {
                ...all,
                ...e
            }
        }
        this.varcharMap = generateAttributeMap(all)
    }

    app: App = {
        seedLimit: 4,
        mode: AppMode.YAML,
        generatorMode: AppGeneratorMode.Postgres,
        complexity: AppComplexityMode.Advanced
    }

    ReloadAndSave() {
        this.saveConfig()
        this.saveState()
        this.loadLastSession()
        this.EmitChangesForApp()
    }

    Reload() {
        this.loadLastSession()
    }

    EmitChangesForApp() {
        this.schemasChange.next(this.schemas)
        this.schemasConfigChange.next(this.schemasConfig)
    }

    Initialize() {
        if (this.initialized) {
            return
        }
        this.initialized = true
        this.loadConfig()
        this.loadLastSession()
        setTimeout(() => {
            this.EmitChangesForApp()
        }, 0)
    }

    private loadConfig() {
        const save = localStorage.getItem(this.configSessionKey)
        if (!save) {
            return
        }
        try {
            const parsed = JSON.parse(save)
            if (!parsed) {
                throw new Error('failed parsing app config')
            }
            if (!parsed['seedLimit']) {
                parsed['seedLimit'] = 4
            }
            if (!parsed['mode']) {
                parsed['mode'] = AppMode.YAML
            }
            if (!parsed['generatorMode']) {
                parsed['generatorMode'] = AppGeneratorMode.Postgres
            }
            if (!parsed['complexity']) {
                parsed['complexity'] = AppComplexityMode.Advanced
            }

            this.app = parsed
        } catch (err) {
            console.error(err)
            localStorage.removeItem(this.configSessionKey)
        }
    }

    private loadLastSession() {
        const stateStr = localStorage.getItem(this.stateSessionKey)
        let schemasConfig: Record<string, SchemaConfig> = {}

        try {
            if (!stateStr) {
                throw new Error('save was falsy, reset to default')
            }
            schemasConfig = JSON.parse(stateStr)
        } catch (err) {
            console.error(err)
            schemasConfig = defaultConfig
            localStorage.setItem(this.stateSessionKey, JSON.stringify(defaultConfig))
        }

        const schemas: Schema[] = ParseSchemaConfig(schemasConfig)

        this.schemasConfig = schemasConfig
        this.schemas = schemas
    }

    saveState() {
        const schemasConfig: Record<string, SchemaConfig> = {}
        for (const s of this.schemas) {
            const s2: SchemaConfig = {
                ID: s.ID,
                Tables: {}
            }
            for (const t of s.Tables) {
                const t2: TableConfig = {
                    ID: t.ID,
                    ParentID: t.Parent.ID,
                    Attributes: {},
                    dragPosition: t.dragPosition
                }
                for (const a of t.Attributes) {
                    const a2: AttributeConfig = {
                        ID: a.ID,
                        ParentID: a.Parent.ID,
                        RefToID: a.RefTo?.ID,
                        Type: a.Type,
                        Option: a.Option,
                        Validation: a.Validation
                    }
                    t2.Attributes[a.Name] = a2
                }
                s2.Tables[t.Name] = t2
            }
            schemasConfig[s.Name] = s2
        }
        this.schemasConfig = schemasConfig
        const s = JSON.stringify(schemasConfig, null, 2)
        if (s) {
            localStorage.setItem(this.stateSessionKey, s)
        }
    }

    private saveConfig() {
        const s = JSON.stringify(this.app, null, 2)
        if (s) {
            localStorage.setItem(this.configSessionKey, s)
        }
    }

    getReference(id: number): Table | null {
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
}

function ParseSchemaConfig(schemasConfig: Record<string, SchemaConfig>) {
    const schemas: Schema[] = []
    let allTables: Table[] = []

    const recheckAttrs: AttributeConfig[] = []

    for (const sk in schemasConfig) {
        if (!Object.prototype.hasOwnProperty.call(schemasConfig, sk)) {
            continue
        }
        const s = schemasConfig[sk]
        const s2 = new Schema(s.ID, sk)
        for (const tk in s.Tables) {
            if (!Object.prototype.hasOwnProperty.call(s.Tables, tk)) {
                continue
            }
            const t = s.Tables[tk]
            const t2p = [s2, ...schemas].find(e => e.ID === t.ParentID)
            if (!t2p) continue

            const t2 = new Table(t.ID, tk, t2p, t.dragPosition)

            for (const ak in t.Attributes) {
                if (!Object.prototype.hasOwnProperty.call(t.Attributes, ak)) {
                    continue
                }
                const a = t.Attributes[ak]
                const a2p = [t2, ...s2.Tables, ...allTables].find(e => e.ID === a.ParentID)
                const r2 = [t2, ...s2.Tables, ...allTables].find(e => e.ID === a.RefToID)
                if (r2) {
                    if (!r2.RefBy) {
                        r2.RefBy = []
                    }
                    // console.log(r2.Name, ' is ref by ', t2.Name);
                    r2.RefBy.push(t2)
                }
                if (!a2p) {
                    continue
                }
                const a2 = new Attribute(a.ID, ak, a.Type, a2p)

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
                t2.Attributes.push(a2)
            }
            allTables.push(t2)
            s2.Tables.push(t2)
        }
        schemas.push(s2)
    }

    CheckForBadReferences(recheckAttrs, allTables, schemas)

    allTables = []
    return schemas
}

function CheckForBadReferences(recheckAttrs: AttributeConfig[], allTables: Table[], schemas: Schema[]) {
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
            realAttr.warnings.push(`"${r.Name}" must exist before referencing`)
            realAttr.RefTo = r
        }
    }
}
