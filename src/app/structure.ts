import {cc, fixPluralGrammar} from './formatting'
import {AttributeMap, randAttrVarchar} from './varchar'
import {v4 as uuidv4} from 'uuid'

export enum Cardinality {
    One = 1 << 4,
    Many = 1 << 5,
    Self = 1 << 6
}

export interface TableGuiMeta {
    id: string
    x: number
    y: number
}

export interface SchemaGuiMeta {
    id: string
    Color: string
}

export enum Lang {
    PGSQL = 1 << 7,
    TSQL = 1 << 8,
    GO = 1 << 9,
    TS = 1 << 10,
    SQLite = 1 << 11,
    Rust = 1 << 12,
    CS = 1 << 13,
    HTML = 1 << 13
}

export interface ParseResult {
    data: Record<string, SchemaConfig>
    suggestions?: Suggestions
    errors?: Suggestions
}

export interface RenderE {
    innerText: string
    class?: string
}

export type Suggestions = Record<number, string[]>

export class FuncIn {
    label: string
    type: string
    validation?: Validation
    isNumerical: boolean
    raw: {
        attribute: Attribute
    }

    constructor(
        l: string,
        t: string,
        validation: Validation | undefined,
        isNumerical: boolean,
        raw: {
            attribute: Attribute
        }
    ) {
        this.label = l
        this.type = t
        this.validation = validation
        this.isNumerical = isNumerical
        this.raw = raw
    }
}

export class FuncOut {
    relatedInput: FuncIn | null
    defaultValue: string
    parseFn: (x: string) => string
    label: string
    type: string
    self: boolean
    primary: boolean
    needsParsed: boolean
    raw: {
        attribute: Attribute
    }

    constructor(
        l: string,
        t: string,
        relatedInput: FuncIn | null,
        newValueFallback: string,
        self: boolean,
        primary: boolean,
        parseFn: (x: string) => string,
        raw: {
            attribute: Attribute
        }
    ) {
        this.label = l
        this.type = t
        this.relatedInput = relatedInput
        this.defaultValue = newValueFallback
        this.self = self
        this.primary = primary
        this.parseFn = parseFn
        this.needsParsed = parseFn('TEST') !== 'TEST'
        this.raw = raw
    }
}

export class Func {
    lang: Lang
    table: Table
    mode: AppGeneratorMode
    inputs: FuncIn[]
    outputs: FuncOut[]
    title: string

    constructor(t: Table, mode: AppGeneratorMode) {
        this.mode = mode
        this.table = t

        this.lang = Func.determineLanguage(mode)
        this.title = this.determineTitle()

        this.inputs = this.genFnInputs()
        this.outputs = this.genFnOutputs(this.inputs)
    }

    hasValidation() {
        let hasValidation = false
        for (const o of this.outputs) {
            const v = o.raw.attribute.Validation
            if (!v) continue
            if (v.Min === undefined && v.Max === undefined) continue
            hasValidation = true
            break
        }
        return hasValidation
    }

    genFnInputs(): FuncIn[] {
        const inputs: FuncIn[] = []

        const allAttrs = this.table.AllAttributes()
        for (const [determinedKey, [srcA, a, isPk, isFk, validation, options]] of Object.entries(allAttrs)) {
            if (a.Option?.SystemField || a.Option?.Default) {
                continue
            }

            const {label, type} = genLabelType('in', a, a, this.lang, Cardinality.Self, undefined, determinedKey)
            const fnIn = new FuncIn(label, type, a.Validation, a.isNumerical(), {
                attribute: a
            })
            inputs.push(fnIn)
        }

        return inputs
    }

    genFnOutputs(inputs: FuncIn[]): FuncOut[] {
        let outputs: FuncOut[] = []

        let inputIndex = 0

        const allAttrs = this.table.AllAttributes()
        for (const [determinedKey, [srcA, a, isPk, isFk, validation, options]] of Object.entries(allAttrs)) {
            const fromAnotherTable = srcA && srcA.Parent.ID !== this.table.ID
            if (fromAnotherTable) continue

            let goFnStructAttributes: FuncOut[]

            // console.log('a.FN :>> ', srcA?.FN, ' -> ', a.FN)

            let isPrimary = false

            // has src attr, so from another table
            if (!!srcA && srcA.Option?.PrimaryKey) {
                isPrimary = true
            }

            // no source attr, so is form self
            if (!srcA && a.Option?.PrimaryKey) {
                isPrimary = true
            }

            if (a.Option?.SystemField || a.Option?.Default) {
                goFnStructAttributes = this.genFnOutput(determinedKey, a, null, isPrimary)
            } else {
                goFnStructAttributes = this.genFnOutput(determinedKey, a, inputs[inputIndex] || null, isPrimary)
                inputIndex += 1
            }

            outputs = outputs.concat(goFnStructAttributes)
        }

        /**
         *
         * TODO want to re-add
         *
         * GO not support cyclical references
         *
         */
        /**
         *
         * For the TS, and GO we do look at what refed by
         * otherwise we only take it at face value
         *
         */
        // if (this.table.RefBy && ![Lang.TSQL, Lang.PGSQL].includes(this.lang)) {
        //     if (this.table.RefBy) {
        //         for (const tbl of this.table.RefBy) {
        //             const allAttrs = tbl.tlb.AllAttributes()
        //             for (const determinedKey in allAttrs) {
        //                 if (!Object.prototype.hasOwnProperty.call(allAttrs, determinedKey)) {
        //                     continue
        //                 }
        //                 const [srcA, a] = allAttrs[determinedKey]
        //                 if (!srcA) continue
        //                 const card = a.isUnique() ? Cardinality.One : Cardinality.Many
        //                 const {label, type, defaultValue, parseStr} = genLabelType('out', a, a, this.lang, card, a.Parent.Name, determinedKey)
        //                 outputs.push(new FuncOut(label, type, null, defaultValue, false, false, parseStr))
        //             }
        //         }
        //     }
        // }

        return outputs
    }

    genFnOutput(determinedKey: string, a: Attribute, relatedInput: FuncIn | null, primary: boolean): FuncOut[] {
        const answer: FuncOut[] = []
        const {label, type, defaultValue, parseStr} = genLabelType('out', a, a, this.lang, Cardinality.Self, undefined, determinedKey)
        const outFn = new FuncOut(label, type, relatedInput, defaultValue, true, primary, parseStr, {
            attribute: a
        })
        answer.push(outFn)
        return answer
    }

    private determineTitle(): string {
        const map: Record<Lang, string> = {
            [Lang.CS]: cc(this.table.Name, 'pl'),
            [Lang.Rust]: cc(this.table.Name, 'sk'),
            [Lang.SQLite]: cc(this.table.Name, 'sk'),
            [Lang.PGSQL]: cc(this.table.Name, 'sk'),
            [Lang.TSQL]: cc(this.table.Name, 'sk'),
            [Lang.GO]: cc(this.table.Name, 'pl'),
            [Lang.TS]: cc(this.table.Name, 'pl')
        }
        return map[this.lang]
    }
    private static determineLanguage(mode: AppGeneratorMode): Lang {
        const isGo = [AppGeneratorMode.GoStructsAndFns].includes(mode)
        if (isGo) {
            return Lang.GO
        }
        const isTs = [AppGeneratorMode.AngularFormControl, AppGeneratorMode.TSClasses, AppGeneratorMode.TSTypesAndFns, AppGeneratorMode.JSClasses].includes(
            mode
        )
        if (isTs) {
            return Lang.TS
        }
        const isCs = [AppGeneratorMode.CSClasses].includes(mode)
        if (isCs) {
            return Lang.CS
        }
        const isTSQL = [AppGeneratorMode.TSQLTables, AppGeneratorMode.TSQLStoredProcedures].includes(mode)
        if (isTSQL) {
            return Lang.TSQL
        }
        const isPostgres = [AppGeneratorMode.PostgresFunctions, AppGeneratorMode.Postgres].includes(mode)
        if (isPostgres) {
            return Lang.PGSQL
        }
        const isRust = [AppGeneratorMode.RustStructAndImpl].includes(mode)
        if (isRust) {
            return Lang.Rust
        }

        console.error('unaccounted mode! defaulted to postgres when determining language')
        return Lang.PGSQL
    }
}

// Validation holds validation rules for an attribute
export interface Validation {
    Required?: boolean
    Min?: number
    Max?: number
}

// Options holds additional options for attributes and tables
export interface AttributeOptions {
    PrimaryKey?: boolean
    Unique?: string[]
    Default?: string
    SystemField?: boolean
}

// Attribute represents an individual attribute of a table
export interface AttributeConfig {
    ID: string
    RefToID?: string
    Type: AttrType
    Option?: AttributeOptions
    Validation?: Validation
    Suggestions?: string[]
    Errors?: string[]
}
// Attribute represents an individual attribute of a table
export class AttributeSuggestion {
    Name: string
    Type: AttrType
    Option?: AttributeOptions
    Validation?: Validation

    constructor(Name: string, Type: AttrType) {
        this.Name = Name
        this.Type = Type
    }
}

export function NewTableConstraint(what: 'Primary Key', t: Table) {
    const map = {
        'Primary Key': `${cc(t.Name, 'sk')}_pkey`
    }
    return map[what]
}

export function NewAttrConstraint(what: 'Foreign Key' | 'Unique' | 'Check' | 'Exclude', a: Attribute | Attribute[]) {
    if (Array.isArray(a)) {
        if (what !== 'Unique' || a.length <= 0) {
            console.error('misuse of new attr constraint, arrays only supported for unique')
        }
        const names = a.map(e => cc(e.Name, 'sk')).join('_')
        return `${cc(a[0].Parent.Name, 'sk')}_${names}_key`
    }
    const map = {
        'Foreign Key': `${cc(a.Parent.Name, 'sk')}_${cc(a.Name, 'sk')}_fkey`,
        Unique: `${cc(a.Parent.Name, 'sk')}_${cc(a.Name, 'sk')}_key`,
        Check: `${cc(a.Parent.Name, 'sk')}_${cc(a.Name, 'sk')}_check`,
        Exclude: `${cc(a.Parent.Name, 'sk')}_${cc(a.Name, 'sk')}_excl`
    }
    return map[what]
}

// Attribute represents an individual attribute of a table
export class Attribute {
    ID: string
    Parent: Table
    RefTo?: Table
    Name: string
    Type: AttrType
    Option?: AttributeOptions
    Validation?: Validation
    warnings: string[] = []

    constructor(ID: string, Name: string, Type: AttrType, Parent: Table) {
        this.ID = ID
        this.Name = Name
        this.Type = Type
        this.Parent = Parent
    }

    get PFN(): string {
        return [cc(this.Parent.Name, 'sk'), cc(this.Name, 'sk')].join('.')
    }

    get FN(): string {
        return [cc(this.Parent.Parent.Name, 'sk'), cc(this.Parent.Name, 'sk'), cc(this.Name, 'sk')].join('.')
    }

    get Description(): string {
        const items: string[] = []
        if (this.Option?.PrimaryKey) {
            items.push('primary')
        }

        if (this.Type === AttrType.SERIAL) {
            items.push('required')
            items.push('unique')
            items.push('system')
            return items.join(', ')
        }

        if (this.Type === 'REF') {
            items.push('reference')
        }
        if (this.Validation?.Required) {
            items.push('required')
        }
        if (this.Option?.Unique) {
            for (const u of this.Option.Unique) {
                if (u === 'unlabeled') {
                    items.push(`unique`)
                } else {
                    items.push(`unique: "${u}"`)
                }
            }
        }
        if (this.Option?.SystemField) {
            items.push('system')
        }
        return items.join(', ')
    }

    Constraint(what: 'Foreign Key' | 'Unique' | 'Check' | 'Exclude') {
        const map = {
            'Foreign Key': `${cc(this.Parent.Name, 'sk')}_${cc(this.Name, 'sk')}_fkey`,
            Unique: `${cc(this.Parent.Name, 'sk')}_${cc(this.Name, 'sk')}_key`,
            Check: `${cc(this.Parent.Name, 'sk')}_${cc(this.Name, 'sk')}_check`,
            Exclude: `${cc(this.Parent.Name, 'sk')}_${cc(this.Name, 'sk')}_excl`
        }
        return map[what]
    }

    isNumerical(): boolean {
        return [
            AttrType.DECIMAL,
            AttrType.REAL,
            AttrType.FLOAT,
            AttrType.SERIAL,
            AttrType.INT,
            // AttrType.VARCHAR,
            AttrType.MONEY
        ].includes(this.Type)
    }

    isStr(): boolean {
        return [AttrType.VARCHAR, AttrType.CHAR].includes(this.Type)
    }

    isBool(): boolean {
        return [AttrType.BIT, AttrType.BOOLEAN].includes(this.Type)
    }

    VarcharType() {
        // may not want if doing non PG
        let max = 15
        if (!this.isStr()) {
            console.warn('Fetching varchar type for non varchar!')
        }
        if (this.Type === AttrType.CHAR) {
            return 'CHAR'
        }
        if (!this.Validation || !this.Validation.Max) {
            console.warn(`missing max validation on "${this.Name}"`)
        } else {
            max = this.Validation.Max
        }
        return ['VARCHAR', `(${max || '15'})`].join('')
    }

    isNullable() {
        const isRequired = this.Validation?.Required === true
        const isPk = this.Option?.PrimaryKey === true
        const isReqOrPk = isRequired || isPk
        const isRef = this.Type === AttrType.REFERENCE

        // An attribute is nullable if it is neither required nor a primary key, and not a reference if it's a primary key
        const isNullable = !isReqOrPk && !(isRef && isPk)

        return isNullable
    }

    isUnique() {
        return this.Option?.Unique || this.Option?.PrimaryKey
    }

    toInsert() {
        return !((!this.Option?.SystemField && this.Option?.Default) || (this.Option?.PrimaryKey && this.Type === AttrType.SERIAL))
    }
}

/**
 *
 * - `srcA` exists if coming from another table
 * - `a` is the attribute
 * - `isPk` is if its a primary key for the sake of this table
 * - `isFk` is if its a foreign key for the sake of this table
 * - `validation` is the validation of the root attr
 * - `options` is the options of the root attr. Ignore its primary key value
 *
 * @example
 * const allAttrs = this.table.AllAttributes()
 * for (const [determinedKey, [srcA, a, isPk, isFk, validation, options]] of Object.entries(allAttrs)) {
 *
 * }
 *
 */
export type DeterminedAttrDetails = [Attribute | undefined, Attribute, boolean, boolean, Validation | null, AttributeOptions | null]

// Schema represents the entire schema containing multiple tables
export interface SchemaConfig {
    ID: string
    Color: string
    Tables: Record<string, TableConfig>
    Suggestions?: string[]
    Errors?: string[]
}
// Schema represents the entire schema containing multiple tables
export class Schema {
    ID: string
    Name: string
    Color: string
    Tables: Table[]

    constructor(ID: string, Name: string, Color: string) {
        this.ID = ID
        this.Name = Name
        this.Color = Color || '#0000FF'

        this.Tables = []
    }
}

// // Options holds additional options for attributes and tables
// export type TableOptions = {
//   AutoPrimaryKey: boolean;
//   AutoTimestamps: boolean;
// };

// Table represents a database table with its attributes and options
export interface TableConfig {
    ID: string
    // Options: TableOptions;
    Attributes: Record<string, AttributeConfig>
    dragPosition: {
        x: number
        y: number
    }
    Suggestions?: string[]
    Errors?: string[]
}

// Table represents a database table with its attributes and options
export class Table {
    ID
    Parent: Schema
    RefBy?: {
        tlb: Table
        attr: Attribute
    }[]
    Name: string
    // Options: TableOptions;
    Attributes: Attribute[]
    dragPosition = {x: 0, y: 0}

    constructor(ID: string, Name: string, Parent: Schema, dragPosition: {x: number; y: number}) {
        this.ID = ID
        this.Name = Name
        this.Parent = Parent
        this.dragPosition = dragPosition

        this.Attributes = []
    }

    get FN(): string {
        return [cc(this.Parent.Name, 'sk'), cc(this.Name, 'sk')].join('.')
    }
    get FNInitials(): string {
        return cc(
            [
                cc(createAbbreviation(this.Parent.Name), 'sk'),
                cc(createAbbreviation(this.Name), 'sk')
                // cc(this.Parent.Name, 'sk'),
                // cc(this.Name, 'sk')
            ].join('_'),
            'pl'
        )
    }
    get SimpleInitials(): string {
        return cc([cc(createAbbreviation(this.Name), 'sk')].join('_'), 'pl')
        // return cc([cc(this.Name, 'sk')].join('_'), 'pl')
    }

    Constraint(what: 'Primary Key') {
        const map = {
            'Primary Key': `${cc(this.Name, 'sk')}_pkey`
        }
        return map[what]
    }

    AllPrimaryDeterminedIdentifiers(): string[] {
        const pks: string[] = []
        const attrs = this.AllAttributes()
        for (const [determinedKey, [srcA, a, isPk, isFk, validation, options]] of Object.entries(attrs)) {
            if (!isPk) continue
            pks.push(determinedKey)
        }
        return pks
    }

    AllAttributes(
        src = 'self',
        depth = 0,
        selfDepth = 0,
        options = {
            foreignKeysOnly: true,
            includeSelf: true,
            foreignAttrs: false,
            maxDepth: 10
        },
        calledFrom?: Attribute,
        og?: Attribute
    ): Record<string, DeterminedAttrDetails> {
        if (depth > options.maxDepth) {
            return {}
        }
        if (selfDepth > 1) {
            return {}
        }
        let answer: Record<string, DeterminedAttrDetails> = {}
        for (const a of this.Attributes) {
            let determinedKey = depth === 0 ? cc(a.Name, 'sk') : `${src}:${cc(a.Name, 'sk')}`

            let isPrimary = false
            let isForeign = false

            {
                // not sure where I want this rn... I know its backwards
                let kr = determinedKey.replaceAll(':', '_').replaceAll('.', '_')
                if (kr[0] === '_') {
                    kr = kr.substring(1, kr.length)
                }
                determinedKey = kr
            }

            if (a.RefTo && options.foreignKeysOnly && a.Option?.PrimaryKey) {
                const refPks = a.RefTo.Attributes.filter(e => e.Option?.PrimaryKey)
                if (refPks.length == 0) continue

                const refAttrs = a.RefTo.AllAttributes(determinedKey, depth + 1, a.RefTo.ID === this.ID ? selfDepth + 1 : 0, {...options}, a, og || a)
                answer = {
                    ...answer,
                    ...refAttrs
                }
                continue
            } else if (a.RefTo) {
                const refPks = a.RefTo.Attributes.filter(e => e.Option?.PrimaryKey)
                if (refPks.length == 0) continue

                const refAttrs = a.RefTo.AllAttributes(determinedKey, depth + 1, a.RefTo.ID === this.ID ? selfDepth + 1 : 0, {...options}, a, og || a)
                answer = {
                    ...answer,
                    ...refAttrs
                }
                continue
            }
            if (depth === 0 && options.includeSelf) {
                isPrimary = a.Option?.PrimaryKey === true
                answer[determinedKey] = [undefined, a, isPrimary, isForeign, a.Validation || null, a.Option || null]
                continue
            }

            isForeign = true

            if (!calledFrom) {
                console.error('missing called from on depth > 0')
                continue
            }

            const distant = depth > 1
            const isRef = calledFrom.RefTo !== undefined
            const originIsPkAndRef = calledFrom.RefTo && calledFrom.Option?.PrimaryKey

            isPrimary = (!distant && calledFrom.Option?.PrimaryKey) || (distant && isRef && !originIsPkAndRef)

            if (distant && isRef && !originIsPkAndRef) continue

            // foreign
            if (options.foreignKeysOnly && a.Option?.PrimaryKey) {
                answer[determinedKey] = [calledFrom, a, isPrimary, isForeign, og?.Validation || null, og?.Option || null]
            } else {
                if (options.foreignAttrs) {
                    answer[determinedKey] = [calledFrom, a, isPrimary, isForeign, og?.Validation || null, og?.Option || null]
                }
            }
        }

        return answer
    }
}

function createAbbreviation(input: string): string {
    // Remove vowels (a, e, i, o, u) and keep the first and last letter
    const vowels = /[aeiouAEIOU]/g

    // Remove vowels and leave the first and last character intact
    const filtered = input
        .split('')
        .filter((char, index) => {
            // Keep the first and last character, and keep the consonants
            return index === 0 || index === input.length - 1 || !vowels.test(char)
        })
        .join('')

    return filtered.toLowerCase() // Convert the result to lowercase
}

export interface TextEditorSyntax {
    attributes: 'Compact' | 'Expanded'
    options: 'Compact' | 'Expanded'
}

export enum AppGeneratorMode {
    PostgresFunctions,
    Postgres,
    AngularFormControl,
    GoStructsAndFns,
    TSTypesAndFns,
    TSClasses,
    CSClasses,
    JSClasses,
    TSQLTables,
    TSQLStoredProcedures,
    SQLiteTables,
    SQLiteJoinQuery,
    RustStructAndImpl,
    PostgresSeed,
    APIGoPostgres,
    HTMLRaw,
    HTMLRawBulma01,
    HTMLGoTemplate,
    HTMLGoTemplateBulma01,
    HTMLAngularReactive
}

export enum AppComplexityMode {
    Simple,
    Advanced
}

export enum AttrType {
    BIT = 'BIT',
    DATE = 'DATE',
    CHAR = 'CHARACTER',
    TIME = 'TIME',
    TIMESTAMP = 'TIMESTAMP',
    DECIMAL = 'DECIMAL',
    REAL = 'REAL',
    FLOAT = 'FLOAT',
    SERIAL = 'SERIAL',
    INT = 'INT',
    BOOLEAN = 'BOOLEAN',
    VARCHAR = 'VARCHAR',
    MONEY = 'MONEY',
    REFERENCE = 'REF'
}

export const attrTypeMap: Record<string, AttrType> = {
    // TIMESTAMP
    ts: AttrType.TIMESTAMP,
    timestamp: AttrType.TIMESTAMP,

    // REFERENCE
    '^': AttrType.REFERENCE,
    ref: AttrType.REFERENCE,
    reference: AttrType.REFERENCE,

    // BIT
    bit: AttrType.BIT,

    // DATE
    d: AttrType.DATE,
    date: AttrType.DATE,

    // CHAR
    c: AttrType.CHAR,
    char: AttrType.CHAR,
    character: AttrType.CHAR,

    // TIME
    t: AttrType.TIME,
    time: AttrType.TIME,

    // DECIMAL
    dec: AttrType.DECIMAL,
    decimal: AttrType.DECIMAL,

    // REAL
    r: AttrType.REAL,
    real: AttrType.REAL,

    // FLOAT
    f: AttrType.FLOAT,
    float: AttrType.FLOAT,

    // SERIAL
    srl: AttrType.SERIAL,
    serial: AttrType.SERIAL,
    'auto increment': AttrType.SERIAL,
    '++': AttrType.SERIAL,

    // INT (INTEGER)
    i: AttrType.INT,
    int: AttrType.INT,
    integer: AttrType.INT,

    // BOOLEAN
    b: AttrType.BOOLEAN,
    bool: AttrType.BOOLEAN,
    boolean: AttrType.BOOLEAN,

    // VARCHAR
    vc: AttrType.VARCHAR,
    varchar: AttrType.VARCHAR,
    s: AttrType.VARCHAR,
    str: AttrType.VARCHAR,
    string: AttrType.VARCHAR,
    word: AttrType.VARCHAR,

    // MONEY
    m: AttrType.MONEY,
    money: AttrType.MONEY
}

// Compact form mappings (shortened representations)
export const attrTypeMapCompact: Record<AttrType, string> = {
    [AttrType.TIMESTAMP]: 'ts',
    [AttrType.VARCHAR]: 'str',
    [AttrType.BIT]: 'bit',
    [AttrType.DATE]: 'date',
    [AttrType.CHAR]: 'char',
    [AttrType.TIME]: 'time',
    [AttrType.DECIMAL]: 'dec',
    [AttrType.REAL]: 'real',
    [AttrType.FLOAT]: 'float',
    [AttrType.SERIAL]: '++',
    [AttrType.INT]: 'int',
    [AttrType.BOOLEAN]: 'bool',
    [AttrType.MONEY]: 'money',
    [AttrType.REFERENCE]: 'ref'
}

// Expanded form mappings (full names)
export const attrTypeMapExpanded: Record<AttrType, string> = {
    [AttrType.TIMESTAMP]: 'timestamp',
    [AttrType.VARCHAR]: 'string',
    [AttrType.BIT]: 'bit',
    [AttrType.DATE]: 'date',
    [AttrType.CHAR]: 'character',
    [AttrType.TIME]: 'time',
    [AttrType.DECIMAL]: 'decimal',
    [AttrType.REAL]: 'real',
    [AttrType.FLOAT]: 'float',
    [AttrType.SERIAL]: 'auto increment',
    [AttrType.INT]: 'integer',
    [AttrType.BOOLEAN]: 'boolean',
    [AttrType.MONEY]: 'money',
    [AttrType.REFERENCE]: 'reference'
}

export interface CanvasSize {
    name: string
    x: number
    y: number
}

export interface App {
    seedLimit: number
    textEditorState: number
    editor: {
        gui: boolean
        splitTui: boolean
    }
    canvasSize: CanvasSize
    generatorMode: AppGeneratorMode
    complexity: AppComplexityMode
}

export function generateSeedData(attr: Attribute, map: AttributeMap): string {
    const Type = attr.Type
    const Required = !attr.isNullable()
    // const Min = attr.Validation?.Min
    const Max = attr.Validation?.Max

    // Helper function to generate a valid date (Postgres format: YYYY-MM-DD)
    const generateDate = () => {
        const year = Math.floor(Math.random() * 20) + 2000 // Random year between 2000 and 2019
        const month = Math.floor(Math.random() * 12) // Random month (0-11, which corresponds to Jan-Dec)
        const day = Math.floor(Math.random() * new Date(year, month + 1, 0).getDate()) + 1 // Get the last date of the month
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` // Format as 'YYYY-MM-DD'
    }

    // Helper function to generate a valid time (Postgres format: HH:MI:SS)
    const generateTime = () => {
        const hours = Math.floor(Math.random() * 24) // Random hour between 0-23
        const minutes = Math.floor(Math.random() * 60) // Random minute between 0-59
        const seconds = Math.floor(Math.random() * 60) // Random second between 0-59
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` // Format as 'HH:MI:SS'
    }

    // Helper function to generate a valid timestamp (Postgres format: YYYY-MM-DD HH:MI:SS)
    const generateTimestamp = () => {
        const date = generateDate() // Generate random date
        const time = generateTime() // Generate random time
        return `'${date} ${time}'` // Combine both for 'YYYY-MM-DD HH:MI:SS' format
    }

    // Helper function to handle nullability
    const getNullOrValue = (value: string) => (Required ? value : Math.random() > 0.5 ? value : 'NULL')

    switch (Type) {
        case AttrType.BIT:
            return getNullOrValue(Math.random() > 0.5 ? '1' : '0')

        case AttrType.DATE: {
            const date = generateDate()
            return getNullOrValue(date)
        }

        case AttrType.TIME: {
            const time = generateTime()
            return getNullOrValue(time)
        }

        case AttrType.TIMESTAMP: {
            const timestamp = generateTimestamp()
            return getNullOrValue(timestamp)
        }

        case AttrType.CHAR:
            return getNullOrValue(`'${String.fromCharCode(Math.floor(Math.random() * 26) + 65)}'`)

        case AttrType.DECIMAL: {
            const decimal = (Math.random() * (Max || 1000)).toFixed(2)
            return getNullOrValue(decimal)
        }

        case AttrType.REAL: {
            const real = (Math.random() * (Max || 1000)).toFixed(3)
            return getNullOrValue(real)
        }

        case AttrType.FLOAT: {
            const float = (Math.random() * (Max || 1000)).toFixed(4)
            return getNullOrValue(float)
        }

        case AttrType.SERIAL:
            return 'DEFAULT' // Serial is usually auto-incremented

        case AttrType.INT: {
            const int = Math.floor(Math.random() * (Max || 1000))
            return getNullOrValue(int.toString())
        }

        case AttrType.BOOLEAN:
            return getNullOrValue(Math.random() > 0.5 ? 'TRUE' : 'FALSE')

        case AttrType.VARCHAR: {
            const randWord = randAttrVarchar(attr.PFN, map)

            let result = ''

            if (randWord) {
                result = randWord
            } else {
                const length = Max ? Math.min(Max, 255) : 10 // Limit to 255 for realistic string length
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

                for (let i = 0; i < length; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length))
                }
            }

            if (Max && result.length > Max) {
                result = result.slice(0, Max - 1)
            }

            return getNullOrValue(`'${result.replaceAll("'", "''")}'`)
        }

        case AttrType.MONEY: {
            const money = (Math.random() * (Max || 1000)).toFixed(2)
            return getNullOrValue(money)
        }

        default:
            return 'NULL' // Fallback for unhandled type
    }
}

export const SQL_TO_TSQL_TYPE: Record<AttrType, string> = {
    [AttrType.BIT]: 'BIT',
    [AttrType.DATE]: 'DATE',
    [AttrType.CHAR]: 'CHAR',
    [AttrType.TIME]: 'TIME',
    [AttrType.TIMESTAMP]: 'DATETIME',
    [AttrType.SERIAL]: 'INT IDENTITY(1,1)',
    [AttrType.DECIMAL]: 'DECIMAL',
    [AttrType.FLOAT]: 'FLOAT',
    [AttrType.REAL]: 'REAL',
    [AttrType.INT]: 'INT',
    [AttrType.BOOLEAN]: 'BIT',
    [AttrType.VARCHAR]: 'VARCHAR',
    [AttrType.MONEY]: 'MONEY',
    [AttrType.REFERENCE]: ''
}

export const SQL_TO_SQL_LITE_TYPE: Record<AttrType, string> = {
    [AttrType.BIT]: 'BIT',
    [AttrType.DATE]: 'DATE',
    [AttrType.CHAR]: 'TEXT',
    [AttrType.TIME]: 'TIME',
    [AttrType.TIMESTAMP]: 'TIMESTAMP',
    [AttrType.SERIAL]: 'INT AUTOINCREMENT',
    [AttrType.DECIMAL]: 'DECIMAL',
    [AttrType.FLOAT]: 'FLOAT',
    [AttrType.REAL]: 'REAL',
    [AttrType.INT]: 'INT',
    [AttrType.BOOLEAN]: 'BOOLEAN',
    [AttrType.VARCHAR]: 'TEXT',
    [AttrType.MONEY]: 'REAL',
    [AttrType.REFERENCE]: ''
}

export const SQL_TO_RUST_TYPE: Record<AttrType, string> = {
    [AttrType.BIT]: 'bool',
    [AttrType.DATE]: 'DateTime<Utc>',
    [AttrType.CHAR]: 'char',
    [AttrType.TIME]: 'DateTime<Utc>',
    [AttrType.TIMESTAMP]: 'DateTime<Utc>',
    [AttrType.SERIAL]: 'i32',
    [AttrType.DECIMAL]: 'f64',
    [AttrType.FLOAT]: 'f32',
    [AttrType.REAL]: 'f64',
    [AttrType.INT]: 'i32',
    [AttrType.BOOLEAN]: 'bool',
    [AttrType.VARCHAR]: 'String',
    [AttrType.MONEY]: 'f64',
    [AttrType.REFERENCE]: 'i32'
}

export const GO_TO_PACKAGE: Record<AttrType, string> = {
    [AttrType.BIT]: `strconv`,
    [AttrType.DATE]: `time`,
    [AttrType.CHAR]: `strconv`,
    [AttrType.TIME]: `time`,
    [AttrType.TIMESTAMP]: `time`,
    [AttrType.SERIAL]: `strconv`,
    [AttrType.DECIMAL]: `strconv`,
    [AttrType.FLOAT]: `strconv`,
    [AttrType.REAL]: `strconv`,
    [AttrType.INT]: `strconv`,
    [AttrType.BOOLEAN]: `strconv`,
    [AttrType.VARCHAR]: `strconv`,
    [AttrType.MONEY]: `strconv`,
    [AttrType.REFERENCE]: `???`
}

export const GO_TO_STR_PARSE: Record<AttrType, (x: string) => string> = {
    [AttrType.BIT]: x => `strconv.ParseBool(${x})`,
    [AttrType.DATE]: x => `time.Parse("2006-01-02", ${x})`,
    [AttrType.CHAR]: x => `${x}`,
    [AttrType.TIME]: x => `time.Parse("15:04:05", ${x})`,
    [AttrType.TIMESTAMP]: x => `time.Parse("2006-01-02 15:04:05", ${x})`,
    [AttrType.SERIAL]: x => `strconv.Atoi(${x})`,
    [AttrType.DECIMAL]: x => `strconv.ParseFloat(${x})`,
    [AttrType.FLOAT]: x => `strconv.ParseFloat(${x})`,
    [AttrType.REAL]: x => `strconv.ParseFloat(${x})`,
    [AttrType.INT]: x => `strconv.Atoi(${x})`,
    [AttrType.BOOLEAN]: x => `strconv.ParseBool(${x})`,
    [AttrType.VARCHAR]: x => `${x}`,
    [AttrType.MONEY]: x => `strconv.ParseFloat(${x})`,
    [AttrType.REFERENCE]: x => `???${x}`
}

export const SQL_TO_GO_TYPE: Record<AttrType, string> = {
    [AttrType.BIT]: 'bool',
    [AttrType.DATE]: 'time.Time',
    [AttrType.CHAR]: 'string',
    [AttrType.TIME]: 'time.Time',
    [AttrType.TIMESTAMP]: 'time.Time',
    [AttrType.SERIAL]: 'int',
    [AttrType.DECIMAL]: 'float64',
    [AttrType.FLOAT]: 'float64',
    [AttrType.REAL]: 'float64',
    [AttrType.INT]: 'int',
    [AttrType.BOOLEAN]: 'bool',
    [AttrType.VARCHAR]: 'string',
    [AttrType.MONEY]: 'float64',
    [AttrType.REFERENCE]: ''
}

export const PG_TO_PG_TYPE: Record<AttrType, string> = {
    [AttrType.BIT]: AttrType.BIT,
    [AttrType.DATE]: AttrType.DATE,
    [AttrType.CHAR]: AttrType.CHAR,
    [AttrType.TIME]: 'TIMETZ',
    [AttrType.TIMESTAMP]: 'TIMESTAMPTZ',
    [AttrType.SERIAL]: AttrType.SERIAL,
    [AttrType.DECIMAL]: AttrType.DECIMAL,
    [AttrType.FLOAT]: AttrType.FLOAT,
    [AttrType.REAL]: AttrType.REAL,
    [AttrType.INT]: AttrType.INT,
    [AttrType.BOOLEAN]: AttrType.BOOLEAN,
    [AttrType.VARCHAR]: AttrType.VARCHAR,
    [AttrType.MONEY]: AttrType.MONEY,
    [AttrType.REFERENCE]: AttrType.REFERENCE
}

export const SQL_TO_GO_DEFAULT_VALUE: Record<AttrType, string> = {
    [AttrType.BIT]: 'false',
    [AttrType.DATE]: 'time.Time{}',
    [AttrType.CHAR]: "' '",
    [AttrType.TIME]: 'time.Time{}',
    [AttrType.TIMESTAMP]: 'time.Time{}',
    [AttrType.SERIAL]: '0',
    [AttrType.DECIMAL]: '0',
    [AttrType.FLOAT]: '0',
    [AttrType.REAL]: '0',
    [AttrType.INT]: '0',
    [AttrType.BOOLEAN]: 'false',
    [AttrType.VARCHAR]: '""',
    [AttrType.MONEY]: '0',
    [AttrType.REFERENCE]: ''
}

export const SQL_TO_RUST_DEFAULT_VALUE: Record<AttrType, string> = {
    [AttrType.BIT]: 'false',
    [AttrType.DATE]: '"1970-01-01"',
    [AttrType.CHAR]: "' '",
    [AttrType.TIME]: '"00:00:00"',
    [AttrType.TIMESTAMP]: '"1970-01-01 00:00:00"',
    [AttrType.SERIAL]: '0',
    [AttrType.DECIMAL]: '0.0',
    [AttrType.FLOAT]: '0.0',
    [AttrType.REAL]: '0.0',
    [AttrType.INT]: '0',
    [AttrType.BOOLEAN]: 'false',
    [AttrType.VARCHAR]: "''",
    [AttrType.MONEY]: '0.0',
    [AttrType.REFERENCE]: '0'
}

export const SQL_TO_TS_TYPE: Record<AttrType, string> = {
    [AttrType.BIT]: 'boolean',
    [AttrType.DATE]: 'Date',
    [AttrType.CHAR]: 'string',
    [AttrType.TIME]: 'Date',
    [AttrType.TIMESTAMP]: 'Date',
    [AttrType.SERIAL]: 'number',
    [AttrType.DECIMAL]: 'number',
    [AttrType.FLOAT]: 'number',
    [AttrType.REAL]: 'number',
    [AttrType.INT]: 'number',
    [AttrType.BOOLEAN]: 'boolean',
    [AttrType.VARCHAR]: 'string',
    [AttrType.MONEY]: 'number',
    [AttrType.REFERENCE]: ''
}

export const SQL_TO_CS_TYPE: Record<AttrType, string> = {
    [AttrType.BIT]: 'bool',
    [AttrType.DATE]: 'DateTime',
    [AttrType.CHAR]: 'string',
    [AttrType.TIME]: 'DateTime',
    [AttrType.TIMESTAMP]: 'DateTime',
    [AttrType.SERIAL]: 'int',
    [AttrType.DECIMAL]: 'int',
    [AttrType.FLOAT]: 'int',
    [AttrType.REAL]: 'int',
    [AttrType.INT]: 'int',
    [AttrType.BOOLEAN]: 'bool',
    [AttrType.VARCHAR]: 'string',
    [AttrType.MONEY]: 'int',
    [AttrType.REFERENCE]: ''
}

export const SQL_TO_TS_DEFAULT_VALUE: Record<AttrType, string> = {
    [AttrType.BIT]: 'false',
    [AttrType.DATE]: 'new Date()',
    [AttrType.CHAR]: "' '",
    [AttrType.TIME]: 'new Date()',
    [AttrType.TIMESTAMP]: 'new Date()',
    [AttrType.SERIAL]: '0',
    [AttrType.DECIMAL]: '0',
    [AttrType.FLOAT]: '0',
    [AttrType.REAL]: '0',
    [AttrType.INT]: '0',
    [AttrType.BOOLEAN]: 'false',
    [AttrType.VARCHAR]: "''",
    [AttrType.MONEY]: '0',
    [AttrType.REFERENCE]: ''
}

export const SQL_TO_CS_DEFAULT_VALUE: Record<AttrType, string> = {
    [AttrType.BIT]: 'false',
    [AttrType.DATE]: 'DateTime.UtcNow',
    [AttrType.CHAR]: '" "',
    [AttrType.TIME]: 'DateTime.UtcNow',
    [AttrType.TIMESTAMP]: 'DateTime.UtcNow',
    [AttrType.SERIAL]: '0',
    [AttrType.DECIMAL]: '0.0',
    [AttrType.FLOAT]: '0.0',
    [AttrType.REAL]: '0.0',
    [AttrType.INT]: '0',
    [AttrType.BOOLEAN]: 'false',
    [AttrType.VARCHAR]: '""',
    [AttrType.MONEY]: '0.00',
    [AttrType.REFERENCE]: ''
}

export const SQL_TO_HTML_INPUT_TYPE: Record<AttrType, string> = {
    [AttrType.BIT]: '', // NOT NEEDED
    [AttrType.DATE]: 'date',
    [AttrType.CHAR]: 'text',
    [AttrType.TIME]: 'time',
    [AttrType.TIMESTAMP]: 'datetime-local',
    [AttrType.SERIAL]: 'number',
    [AttrType.DECIMAL]: 'number',
    [AttrType.FLOAT]: 'number',
    [AttrType.REAL]: 'number',
    [AttrType.INT]: 'number',
    [AttrType.BOOLEAN]: '', // NOT NEEDED
    [AttrType.VARCHAR]: 'text',
    [AttrType.MONEY]: 'number',
    [AttrType.REFERENCE]: '???'
}

export const SQL_TO_HTML_BULMA_CLASS: Record<AttrType, string> = {
    [AttrType.BIT]: '', // NOT NEEDED
    [AttrType.DATE]: 'input',
    [AttrType.CHAR]: 'input',
    [AttrType.TIME]: 'input',
    [AttrType.TIMESTAMP]: 'input',
    [AttrType.SERIAL]: 'input',
    [AttrType.DECIMAL]: 'input',
    [AttrType.FLOAT]: 'input',
    [AttrType.REAL]: 'input',
    [AttrType.INT]: 'input',
    [AttrType.BOOLEAN]: '', // NOT NEEDED
    [AttrType.VARCHAR]: 'input',
    [AttrType.MONEY]: 'number',
    [AttrType.REFERENCE]: '???'
}

function genLabelType(
    io: 'in' | 'out',
    aL: Attribute,
    aT: Attribute,
    lang: Lang,
    cardinality: Cardinality,
    overrideType = '',
    determinedKey: string
): {
    label: string
    type: string
    defaultValue: string
    parseStr: (x: string) => string
} {
    const map = new Map<
        number,
        {
            label: string
            type: string
            defaultValue: string
            parseStr: (x: string) => string
        }
    >()

    const isNullable = aL.isNullable()

    // console.log(' ');
    // console.log(determinedKey);
    // console.log('    nullable due to required or primary: ', !isReqOrPk);
    // console.log('    nullable due to primary and reference: ', isPk && isRef);

    //#region SQLite

    const sqliteCase = io === 'in' ? 'sk' : 'sk'
    let sqliteType: string = SQL_TO_SQL_LITE_TYPE[aT.Type]

    if (!sqliteType) {
        sqliteType = SQL_TO_SQL_LITE_TYPE[aL.Type]
    }

    map.set(Lang.SQLite | Cardinality.Self, {
        label: cc(determinedKey, sqliteCase),
        type: sqliteType,
        defaultValue: '',
        parseStr: () => ''
    })

    //    -    -

    map.set(Lang.SQLite | Cardinality.One, {
        label: cc(determinedKey, sqliteCase),
        type: sqliteType,
        defaultValue: '',
        parseStr: () => ''
    })
    //    -    -

    map.set(Lang.SQLite | Cardinality.Many, {
        label: fixPluralGrammar(cc(determinedKey, sqliteCase) + 's'),
        type: sqliteType,
        defaultValue: '',
        parseStr: () => ''
    })

    //#endregion

    //#region PostgreSQL

    const psqlCase = io === 'in' ? 'sk' : 'sk'
    let psqlType: string = aT.Type

    if (!psqlType) {
        psqlType = SQL_TO_TSQL_TYPE[aL.Type]
    }

    if (psqlType === AttrType.SERIAL) {
        psqlType = 'INT'
    }

    map.set(Lang.PGSQL | Cardinality.Self, {
        label: cc(determinedKey, psqlCase),
        type: psqlType,
        defaultValue: '',
        parseStr: () => ''
    })

    //    -    -

    map.set(Lang.PGSQL | Cardinality.One, {
        label: cc(determinedKey, psqlCase),
        type: psqlType,
        defaultValue: '',
        parseStr: () => ''
    })

    //    -    -

    map.set(Lang.PGSQL | Cardinality.Many, {
        label: fixPluralGrammar(cc(determinedKey, psqlCase) + 's'),
        type: psqlType,
        defaultValue: '',
        parseStr: () => ''
    })
    //#endregion

    //#region TSQL

    const tsqlCase = io === 'in' ? 'sk' : 'sk'
    let tsqlType = ''

    if (!tsqlType) {
        tsqlType = SQL_TO_TSQL_TYPE[aL.Type]
    }

    if (tsqlType === SQL_TO_TSQL_TYPE[AttrType.SERIAL]) {
        tsqlType = 'INT'
    }

    map.set(Lang.TSQL | Cardinality.Self, {
        label: cc(determinedKey, tsqlCase),
        type: tsqlType,
        defaultValue: '',
        parseStr: () => ''
    })

    //    -    -

    map.set(Lang.TSQL | Cardinality.One, {
        label: cc(determinedKey, tsqlCase),
        type: tsqlType,
        defaultValue: '',
        parseStr: () => ''
    })

    //    -    -

    map.set(Lang.TSQL | Cardinality.Many, {
        label: fixPluralGrammar(cc(determinedKey, tsqlCase) + 's'),
        type: tsqlType,
        defaultValue: '',
        parseStr: () => ''
    })
    //#endregion

    //#region TSQL

    const htmlCase = io === 'in' ? 'sk' : 'sk'
    let htmlType = ''

    if (!htmlType) {
        htmlType = SQL_TO_HTML_INPUT_TYPE[aL.Type]
    }

    if (htmlType === SQL_TO_HTML_INPUT_TYPE[AttrType.SERIAL]) {
        htmlType = 'number'
    }

    map.set(Lang.HTML | Cardinality.Self, {
        label: cc(determinedKey, htmlCase),
        type: htmlType,
        defaultValue: '',
        parseStr: () => ''
    })

    //    -    -

    map.set(Lang.HTML | Cardinality.One, {
        label: cc(determinedKey, htmlCase),
        type: htmlType,
        defaultValue: '',
        parseStr: () => ''
    })

    //    -    -

    map.set(Lang.HTML | Cardinality.Many, {
        label: fixPluralGrammar(cc(determinedKey, htmlCase) + 's'),
        type: htmlType,
        defaultValue: '',
        parseStr: () => ''
    })
    //#endregion

    //#region Typescript

    const tsNullable = isNullable ? ' | null' : ''
    let tsType = overrideType ? cc(overrideType, 'pl') : SQL_TO_TS_TYPE[aT.Type]
    const tsCase = io === 'in' ? 'cm' : 'cm'
    const tsOverrideTypeRelatedLabel = fixPluralGrammar(cc(aT.Name, tsCase) + 's')

    if (!tsType) {
        tsType = SQL_TO_TS_TYPE[aL.Type]
    }

    map.set(Lang.TS | Cardinality.Self, {
        label: cc(determinedKey, tsCase),
        type: tsType + tsNullable,
        defaultValue: SQL_TO_TS_DEFAULT_VALUE[aT.Type],
        parseStr: () => ''
    })
    //    -    -

    map.set(Lang.TS | Cardinality.One, {
        label: cc(determinedKey, tsCase),
        type: tsType + ' | null',
        defaultValue: 'null',
        parseStr: () => ''
    })

    //    -    -

    map.set(Lang.TS | Cardinality.Many, {
        label: overrideType ? tsOverrideTypeRelatedLabel : fixPluralGrammar(cc(determinedKey, tsCase) + 's'),
        type: `${tsType}[]` + tsNullable,
        defaultValue: '[]',
        parseStr: () => ''
    })

    //#endregion

    //#region C#

    const csNullable = isNullable ? '?' : ''
    let csType = overrideType ? cc(overrideType, 'pl') : SQL_TO_CS_TYPE[aT.Type]
    const csCase = io === 'in' ? 'cm' : 'pl'
    const csOverrideTypeRelatedLabel = fixPluralGrammar(cc(aT.Name, csCase) + 's')

    if (!csType) {
        csType = SQL_TO_CS_TYPE[aL.Type]
    }

    map.set(Lang.CS | Cardinality.Self, {
        label: cc(determinedKey, csCase),
        type: csType + csNullable,
        defaultValue: SQL_TO_CS_DEFAULT_VALUE[aT.Type],
        parseStr: () => ''
    })

    //    -    -

    map.set(Lang.CS | Cardinality.One, {
        label: cc(determinedKey, csCase),
        type: csType + '?',
        defaultValue: 'null',
        parseStr: () => ''
    })

    //    -    -

    map.set(Lang.CS | Cardinality.Many, {
        label: overrideType ? csOverrideTypeRelatedLabel : fixPluralGrammar(cc(determinedKey, csCase) + 's'),
        type: `List<${csType}>` + csNullable,
        defaultValue: `new List<${csType}>()`,
        parseStr: () => ''
    })

    //#endregion

    //#region Go Lang

    const goNullable = isNullable ? '*' : ''

    let goType = overrideType ? cc(overrideType, 'pl') : SQL_TO_GO_TYPE[aT.Type] || SQL_TO_GO_TYPE[aL.Type]
    const goCase = io === 'in' ? 'cm' : 'pl'
    const goOverrideTypeRelatedLabel = fixPluralGrammar(cc(aT.Name, goCase) + 's')

    if (!goType) {
        goType = SQL_TO_GO_TYPE[aL.Type]
    }

    map.set(Lang.GO | Cardinality.Self, {
        label: cc(determinedKey, goCase),
        type: goNullable + goType,
        defaultValue: SQL_TO_GO_DEFAULT_VALUE[aL.Type],
        parseStr: GO_TO_STR_PARSE[aL.Type]
    })

    //    -    -

    map.set(Lang.GO | Cardinality.One, {
        label: cc(`${aL.PFN}_${aT.Name}`, goCase),
        type: io === 'in' ? '*' + goType : '*' + goType,
        defaultValue: 'nil',
        parseStr: GO_TO_STR_PARSE[aL.Type]
    })

    //    -    -

    map.set(Lang.GO | Cardinality.Many, {
        label: overrideType ? goOverrideTypeRelatedLabel : fixPluralGrammar(cc(determinedKey, goCase) + 's'),
        type: '[]' + goType,
        defaultValue: '[]' + goType + '{}',
        parseStr: GO_TO_STR_PARSE[aL.Type]
    })

    //#endregion

    //#region Rust

    let rustType = overrideType ? cc(overrideType, 'pl') : SQL_TO_RUST_TYPE[aT.Type] || SQL_TO_RUST_TYPE[aL.Type]
    const rustCase = io === 'in' ? 'sk' : 'sk'
    const rustOverrideTypeRelatedLabel = fixPluralGrammar(cc(aT.Name, rustCase) + 's')

    if (!rustType) {
        rustType = SQL_TO_RUST_TYPE[aL.Type]
    }

    map.set(Lang.Rust | Cardinality.Self, {
        label: cc(determinedKey, rustCase),
        type: isNullable ? `Option<${rustType}>` : rustType,
        defaultValue: SQL_TO_RUST_DEFAULT_VALUE[aL.Type],
        parseStr: () => ''
    })

    //    -    -

    map.set(Lang.Rust | Cardinality.One, {
        label: cc(determinedKey, rustCase),
        // type: isNullable ? `Option<${rustType}>` : rustType,
        type: `Option<${rustType}>`,
        defaultValue: 'None',
        parseStr: () => ''
    })

    //    -    -

    map.set(Lang.Rust | Cardinality.Many, {
        label: overrideType ? rustOverrideTypeRelatedLabel : fixPluralGrammar(cc(determinedKey, rustCase) + 's'),
        type: isNullable ? `Option<${`Vec<${rustType}>`}>` : `Vec<${rustType}>`,
        defaultValue: 'Vec::new()',
        parseStr: () => ''
    })

    //#endregion

    const answer = map.get(lang | cardinality)

    if (!answer) {
        console.error(`unaccounted for language relation combo\n"${{lang}}, ${{cardinality}}"\ndefaulted to diff schema postgres syntax`)
        return {
            label: cc(aL.FN, 'sk'),
            type: psqlType,
            defaultValue: '',
            parseStr: () => ''
        }
    }

    const def = GenerateDefaultValue(aL, lang)
    if (def) {
        answer.defaultValue = def
        return answer
    }

    return answer
}

export const GenerateDefaultValue = (attr: Attribute, lang: Lang): string | null => {
    const isNullable = attr.isNullable()

    let d = attr.Option?.Default

    if (!d) {
        return null
    }

    const validFn = validationMap.get(attr.Type)
    if (!validFn) {
        return null
    }

    const valid = validFn(d)
    if (!valid) {
        return null
    }

    if (attr.Type === AttrType.DATE && d.trim().toUpperCase() === 'NOW') {
        if (lang === Lang.PGSQL) {
            d = 'CURRENT_DATE'
        } else if (lang === Lang.TSQL) {
            d = 'GETDATE()'
        } else if (lang === Lang.SQLite) {
            d = 'CURRENT_DATE'
        }
    }

    if (attr.Type === AttrType.TIME && d.trim().toUpperCase() === 'NOW') {
        if (lang === Lang.PGSQL) {
            d = `CURRENT_TIME AT TIME ZONE 'UTC'`
        } else if (lang === Lang.TSQL) {
            d = 'CAST(SYSDATETIMEOFFSET() AS TIME)'
        } else if (lang === Lang.SQLite) {
            d = 'CURRENT_TIME'
        }
    }

    if (attr.Type === AttrType.TIMESTAMP && d.trim().toUpperCase() === 'NOW') {
        if (lang === Lang.PGSQL) {
            d = `CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`
        } else if (lang === Lang.TSQL) {
            d = 'SYSDATETIMEOFFSET()'
        } else if (lang === Lang.SQLite) {
            d = 'CURRENT_TIMESTAMP'
        }
    }

    if ([Lang.Rust].includes(lang)) {
        let answer = ''
        switch (attr.Type) {
            case AttrType.CHAR:
                answer = `'${d.replaceAll('\\', '\\\\').replaceAll("'", "'")}'`
                break
            case AttrType.VARCHAR:
                answer = `String::from("${d.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}")`
                break
            case AttrType.DATE:
                {
                    const s = d.split('-')
                    if (d === 'NOW()' || d === 'CURRENT_DATE') {
                        answer = `Utc::now()`
                    } else if (s.length === 3) {
                        answer = `Utc.from_utc_naive(&NaiveDate::from_ymd(${s[0]}, ${s[1]}, ${s[2]}))`
                    }
                }
                break
            case AttrType.TIME:
                {
                    const t = d.split(':')
                    if (d === 'NOW()' || d === 'CURRENT_TIME') {
                        answer = `Utc::now()`
                    } else if (t.length === 3) {
                        answer = `Utc.from_utc_naive(&NaiveDateTime::new(NaiveDate::from_ymd(1970, 1, 1), NaiveTime::from_hms(${t[0]}, ${t[1]}, ${t[2]})))`
                    }
                }
                break
            case AttrType.TIMESTAMP:
                {
                    const s = d.split(' ')
                    if (d === 'NOW()' || d === 'CURRENT_TIMESTAMP') {
                        answer = `Utc::now()`
                    } else if (s.length === 2) {
                        const dt = s[0].split('-')
                        const t = s[1].split(':')
                        if (dt.length === 3 && t.length === 3) {
                            answer = `Utc.from_utc_naive(&NaiveDateTime::new(NaiveDate::from_ymd(${dt[0]}, ${dt[1]}, ${dt[2]}), NaiveTime::from_hms(${t[0]}, ${t[1]}, ${t[2]})))`
                        }
                    }
                }
                break
            default:
                answer = `${d}`
                break
        }
        if (answer && isNullable) {
            return `Some(${answer})`
        } else if (!answer && isNullable) {
            return 'None'
        } else {
            return answer
        }
    }

    if ([Lang.PGSQL, Lang.TSQL].includes(lang)) {
        switch (attr.Type) {
            case AttrType.CHAR:
                return `'${d.replaceAll('\\', '\\\\').replaceAll("'", "'")}'`
            case AttrType.VARCHAR:
                return `'${d.replaceAll("'", "''")}'`
            default:
                return `${d}`
        }
    }

    if (lang === Lang.SQLite) {
        switch (attr.Type) {
            case AttrType.CHAR:
                return `'${d.replaceAll('\\', '\\\\').replaceAll("'", "'")}'`
            case AttrType.VARCHAR:
                return `'${d.replaceAll("'", "''")}'`
            case AttrType.DATE:
                {
                    const s = d.split('-')
                    if (d === 'NOW()') {
                        return `CURRENT_DATE`
                    } else if (s.length === 3) {
                        return `'${d}'`
                    }
                }
                break
            case AttrType.TIME:
                {
                    const t = d.split(':')
                    if (d === 'NOW()') {
                        return `CURRENT_TIME`
                    } else if (t.length === 3) {
                        return `'${d}'`
                    }
                }
                break
            case AttrType.TIMESTAMP:
                {
                    const s = d.split(' ')
                    if (d === 'NOW()') {
                        return `CURRENT_TIMESTAMP`
                    } else if (s.length === 2) {
                        const dt = s[0].split('-')
                        const t = s[1].split(':')
                        if (dt.length === 3 && t.length === 3) {
                            return `'${d}'`
                        }
                    }
                }
                break
            default:
                return `${d}`
        }
    }

    if (lang === Lang.GO) {
        function getMonthString(month: string): string {
            const months: Record<string, string> = {
                '1': 'January',
                '2': 'February',
                '3': 'March',
                '4': 'April',
                '5': 'May',
                '6': 'June',
                '7': 'July',
                '8': 'August',
                '9': 'September',
                '01': 'January',
                '02': 'February',
                '03': 'March',
                '04': 'April',
                '05': 'May',
                '06': 'June',
                '07': 'July',
                '08': 'August',
                '09': 'September',
                '10': 'October',
                '11': 'November',
                '12': 'December'
            }

            const monthName = months[month]

            if (monthName) {
                return `time.${monthName}`
            } else {
                return 'Invalid month'
            }
        }

        switch (attr.Type) {
            case AttrType.BIT:
                return `${d}`
            case AttrType.DATE:
                {
                    const s = d.split('-')
                    if (s.length === 3) {
                        // Parameters: year, month, day, hour, minute, second, nanosecond
                        return `time.Date(${s[0]}, ${getMonthString(s[1])}, ${s[2]}, 0, 0, 0, 0, time.UTC)`
                    } else if (d === 'CURRENT_DATE') {
                        return `time.Now()`
                    } else if (d === 'NOW()') {
                        return `time.Now()`
                    }
                }
                break
            case AttrType.CHAR:
                if (d.length === 1) {
                    return `"${d}"`
                }
                break
            case AttrType.TIME:
                {
                    const s = d.split(':')
                    if (s.length === 3) {
                        // Parameters: year, month, day, hour, minute, second, nanosecond
                        return `time.Date(1, 1, 1, ${s[0]}, ${s[1]}, ${s[2]}, 0, time.UTC)`
                    } else if (d === 'CURRENT_TIME') {
                        return `time.Now()`
                    } else if (d === 'NOW()') {
                        return `time.Now()`
                    }
                }
                return `${d}`
            case AttrType.TIMESTAMP:
                {
                    const s = d.split(' ')
                    if (s.length === 2) {
                        const date = s[0].split('-')
                        const time = s[1].split(':')
                        if (date.length === 3 && time.length === 3) {
                            // Parameters: year, month, day, hour, minute, second, nanosecond
                            return `time.Date(${date[0]}, ${getMonthString(date[1])}, ${date[2]}, ${time[0]}, ${time[1]}, ${time[2]}, 0, time.UTC)`
                        }
                    } else if (d === 'CURRENT_TIMESTAMP') {
                        return `time.Now()`
                    } else if (d === 'NOW()') {
                        return `time.Now()`
                    }
                }
                return `${d}`
            case AttrType.DECIMAL:
                return `${d}`
            case AttrType.REAL:
                return `${d}`
            case AttrType.FLOAT:
                return `${d}`
            case AttrType.SERIAL:
                return `${d}`
            case AttrType.INT:
                return `${d}`
            case AttrType.BOOLEAN:
                return `${d}`
            case AttrType.VARCHAR:
                return `"${d.replaceAll('"', '\\"')}"`
            case AttrType.MONEY:
                return `${d}`
        }
    }

    if (lang === Lang.TS) {
        function getMonthString(month: string): string {
            const months: Record<string, string> = {
                '1': '0',
                '2': '1',
                '3': '2',
                '4': '3',
                '5': '4',
                '6': '5',
                '7': '6',
                '8': '7',
                '9': '8',
                '01': '0',
                '02': '1',
                '03': '2',
                '04': '3',
                '05': '4',
                '06': '5',
                '07': '6',
                '08': '7',
                '09': '8',
                '10': '9',
                '11': '10',
                '12': '11'
            }

            const monthName = months[month]

            if (monthName) {
                return `time.${monthName}`
            } else {
                return 'Invalid month'
            }
        }

        switch (attr.Type) {
            case AttrType.BIT:
                return `${d}`
            case AttrType.DATE:
                {
                    const s = d.split('-')
                    if (s.length === 3) {
                        // const specificDate = new Date(Date.UTC(2021, 0, 1, 10, 45, 22, 0)); // January 1, 2021, 10:45:22 UTC
                        return `new Date(Date.UTC(${s[0]}, ${getMonthString(s[1])}, ${s[2]}, 0, 0, 0, 0))`
                    } else if (d === 'CURRENT_DATE') {
                        return `new Date()`
                    } else if (d === 'NOW()') {
                        return `new Date()`
                    }
                }
                break
            case AttrType.CHAR:
                if (d.length === 1) {
                    return `'${d}'`
                }
                break
            case AttrType.TIME:
                {
                    const s = d.split(':')
                    if (s.length === 3) {
                        // const specificDate = new Date(Date.UTC(2021, 0, 1, 10, 45, 22, 0)); // January 1, 2021, 10:45:22 UTC
                        return `new Date(Date.UTC(1970, 0, 1, ${s[0]}, ${s[1]}, ${s[2]}, 0))`
                    } else if (d === 'CURRENT_TIME') {
                        return `new Date()`
                    } else if (d === 'NOW()') {
                        return `new Date()`
                    }
                }
                return `${d}`
            case AttrType.TIMESTAMP:
                {
                    const s = d.split(' ')
                    if (s.length === 2) {
                        const date = s[0].split('-')
                        const time = s[1].split(':')
                        if (date.length === 3 && time.length === 3) {
                            // Parameters: year, month, day, hour, minute, second, nanosecond
                            return `new Date(Date.UTC(${date[0]}, ${getMonthString(date[1])}, ${date[2]}, ${time[0]}, ${time[1]}, ${time[2]}, 0))`
                        }
                    } else if (d === 'CURRENT_TIMESTAMP') {
                        return `new Date()`
                    } else if (d === 'NOW()') {
                        return `new Date()`
                    }
                }
                return `${d}`
            case AttrType.DECIMAL:
                return `${d}`
            case AttrType.REAL:
                return `${d}`
            case AttrType.FLOAT:
                return `${d}`
            case AttrType.SERIAL:
                return `${d}`
            case AttrType.INT:
                return `${d}`
            case AttrType.BOOLEAN:
                return `${d}`
            case AttrType.VARCHAR:
                return `'${d.replaceAll("'", "''")}'`
            case AttrType.MONEY:
                return `${d}`
        }
    }

    if (lang === Lang.CS) {
        switch (attr.Type) {
            case AttrType.BIT:
                return `${d}`
            case AttrType.DATE:
                {
                    const s = d.split('-')
                    if (s.length === 3) {
                        return `new DateTime(${s[0]}, ${s[1]}, ${s[2]}, 0, 0, 0, 0, DateTimeKind.Utc)`
                    } else if (d === 'CURRENT_DATE') {
                        return `DateTime.UtcNow`
                    } else if (d === 'NOW()') {
                        return `DateTime.UtcNow`
                    }
                }
                break
            case AttrType.CHAR:
                if (d.length === 1) {
                    return `"${d.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
                }
                break
            case AttrType.TIME:
                {
                    const s = d.split(':')
                    if (s.length === 3) {
                        return `new DateTime(1970, 0, 1, ${s[0]}, ${s[1]}, ${s[2]}, 0, DateTimeKind.Utc)`
                    } else if (d === 'CURRENT_TIME') {
                        return `DateTime.UtcNow`
                    } else if (d === 'NOW()') {
                        return `DateTime.UtcNow`
                    }
                }
                return `${d}`
            case AttrType.TIMESTAMP:
                {
                    const s = d.split(' ')
                    if (s.length === 2) {
                        const date = s[0].split('-')
                        const time = s[1].split(':')
                        if (date.length === 3 && time.length === 3) {
                            return `new DateTime(${date[0]}, ${date[1]}, ${date[2]}, ${time[0]}, ${time[1]}, ${time[2]}, 0, DateTimeKind.Utc)`
                        }
                    } else if (d === 'CURRENT_TIMESTAMP') {
                        return `DateTime.UtcNow`
                    } else if (d === 'NOW()') {
                        return `DateTime.UtcNow`
                    }
                }
                return `${d}`
            case AttrType.DECIMAL:
                return `${d}`
            case AttrType.REAL:
                return `${d}`
            case AttrType.FLOAT:
                return `${d}`
            case AttrType.SERIAL:
                return `${d}`
            case AttrType.INT:
                return `${d}`
            case AttrType.BOOLEAN:
                return `${d}`
            case AttrType.VARCHAR:
                return `"${d.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
            case AttrType.MONEY:
                return `${d}`
        }
    }

    return null
}

export const validationMap = new Map<AttrType, (x: string) => boolean>()
const validationMapPatterns = {
    date: /^\d{4}-\d{2}-\d{2}$/,
    time: /^([0-9]{2}:[0-9]{2}:[0-9]{2}-[0-9]{2}:[0-9]{2}|[0-9]{2}:[0-9]{2}:[0-9]{2})$/,
    timestamp: /^([0-9]{1,4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}-[0-9]{2}:[0-9]{2}|[0-9]{1,4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})$/,
    decimal: /^-?\d+(\.\d+)?$/,
    real: /^-?\d+(\.\d+)?$/,
    float: /^-?\d+(\.\d+)?$/,
    serial: /^[1-9]\d*$/,
    integer: /^-?\d+$/,
    boolean: /^(true|false)$/i,
    varchar: /^.*$/,
    money: /^-?\d+(\.\d{1,2})?$/
}

const isSpecialValue = (x: string, specialValues: string[]): boolean => {
    return specialValues.includes(x.toUpperCase())
}

const matchesRegex = (x: string, regex: RegExp): boolean => {
    return regex.test(x)
}

// Function to get special values for each attribute type
const getSpecialValues = (attrType: AttrType): string[] => {
    switch (attrType) {
        case AttrType.DATE:
            return ['NOW']
        case AttrType.TIME:
            return ['NOW']
        case AttrType.TIMESTAMP:
            return ['NOW']
        // case AttrType.DATE:
        //     return ['NOW', 'NOW()']
        // case AttrType.TIME:
        //     return ['CURRENT_TIME', 'NOW()']
        // case AttrType.TIMESTAMP:
        //     return ['CURRENT_TIMESTAMP', 'NOW()']
        default:
            return []
    }
}

validationMap.set(AttrType.BIT, (x: string) => ['1', '0'].includes(x))
validationMap.set(AttrType.DATE, (x: string) => {
    const specialValues = getSpecialValues(AttrType.DATE)
    if (isSpecialValue(x, specialValues)) return true
    return matchesRegex(x, validationMapPatterns.date)
})
validationMap.set(AttrType.CHAR, (x: string) => x.length === 1)
validationMap.set(AttrType.TIME, (x: string) => {
    const specialValues = getSpecialValues(AttrType.TIME)
    if (isSpecialValue(x, specialValues)) return true
    return matchesRegex(x, validationMapPatterns.time)
})

validationMap.set(AttrType.TIMESTAMP, (x: string) => {
    const specialValues = getSpecialValues(AttrType.TIMESTAMP)
    if (isSpecialValue(x, specialValues)) return true
    return matchesRegex(x, validationMapPatterns.timestamp)
})

validationMap.set(AttrType.DECIMAL, (x: string) => matchesRegex(x, validationMapPatterns.decimal))
validationMap.set(AttrType.REAL, (x: string) => matchesRegex(x, validationMapPatterns.real))
validationMap.set(AttrType.FLOAT, (x: string) => matchesRegex(x, validationMapPatterns.float))
validationMap.set(AttrType.SERIAL, (x: string) => matchesRegex(x, validationMapPatterns.serial))
validationMap.set(AttrType.INT, (x: string) => matchesRegex(x, validationMapPatterns.integer))
validationMap.set(AttrType.BOOLEAN, (x: string) => matchesRegex(x, validationMapPatterns.boolean))
validationMap.set(AttrType.VARCHAR, (x: string) => typeof x === 'string')
validationMap.set(AttrType.MONEY, (x: string) => matchesRegex(x, validationMapPatterns.money))

export const defaultValueValidatorHintMap = new Map<AttrType, string>()
defaultValueValidatorHintMap.set(AttrType.BIT, "'0' or '1'")
defaultValueValidatorHintMap.set(AttrType.CHAR, '1 character')
defaultValueValidatorHintMap.set(AttrType.DATE, 'YYYY-MM-DD, or now')
// defaultValueValidatorHintMap.set(AttrType.TIME, 'HH:MM:SS with optional utc offset -HH:MM, or NOW')
// defaultValueValidatorHintMap.set(AttrType.TIMESTAMP, 'YYYY-MM-DD HH:MM:SS with optional utc offset -HH:MM, or NOW')
defaultValueValidatorHintMap.set(AttrType.TIME, 'HH:MM:SS or now')
defaultValueValidatorHintMap.set(AttrType.TIMESTAMP, 'YYYY-MM-DD HH:MM:SS or now')
defaultValueValidatorHintMap.set(AttrType.DECIMAL, 'A decimal point (e.g., 123.45, -12.3)')
defaultValueValidatorHintMap.set(AttrType.REAL, 'A real number (e.g., 123.45, -12.3)')
defaultValueValidatorHintMap.set(AttrType.FLOAT, 'A floating-point number (e.g., 123.45, -12.3)')
defaultValueValidatorHintMap.set(AttrType.SERIAL, 'A positive integer')
defaultValueValidatorHintMap.set(AttrType.INT, 'Integer value (e.g., -123, 456)')
defaultValueValidatorHintMap.set(AttrType.BOOLEAN, "'true' or 'false'")
defaultValueValidatorHintMap.set(AttrType.VARCHAR, 'Any string is acceptable')
defaultValueValidatorHintMap.set(AttrType.MONEY, "Money: e.g., '12.34', or '-12.34'")
