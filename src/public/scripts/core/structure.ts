export const PK_PARAM_TAG = 'target_';
export const PARAM_PREFIX = 'new_';
export const FK_PREFIX = 'fk';
const IN_OUT_PREFIX = 'in_out_';
export const UNALIASED_SELF_REFERENCE_ALIAS = 'self_';

/**
 * Determines the max depth of joins to make for self references
 */
export const JOIN_DEPTH = 2 as const;

export enum Types {
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
    xs = 'VARCHAR(8)',
    s = 'VARCHAR(128)',
    m = 'VARCHAR(512)',
    l = 'VARCHAR(2048)',
    xl = 'VARCHAR(8192)',
    xxl = 'VARCHAR(32768)',
}

export const MAX_LOOP_COUNT = 10000 as const;
export const MAX_SEARCH_NESTED_COUNT = 100 as const;
export const SQL_TABLE_ATTRIBUTES: {
    [x: string]: RegExp;
} = {
    [Types.BIT]: /^\s{2,8}- bit [a-zA-Z_]{2,16}/,
    [Types.DECIMAL]: /^\s{2,8}- (d|dec|decimal) [a-zA-Z_]{2,16}/,
    [Types.DATE]: /^\s{2,8}- (dt|date) [a-zA-Z_]{2,16}/,
    [Types.CHAR]: /^\s{2,8}- (c|char|character) [a-zA-Z_]{2,16}/,
    [Types.TIME]: /^\s{2,8}- (t|time) [a-zA-Z_]{2,16}/,
    [Types.TIMESTAMP]: /^\s{2,8}- (ts|timestamp) [a-zA-Z_]{2,16}/,
    [Types.FLOAT]: /^\s{2,8}- (f|float) [a-zA-Z_]{2,16}/,
    [Types.REAL]: /^\s{2,8}- (r|real) [a-zA-Z_]{2,16}/,
    [Types.INT]: /^\s{2,8}- (i|int|integer) [a-zA-Z_]{2,16}/,
    [Types.BOOLEAN]: /^\s{2,8}- (b|boolean|bool) [a-zA-Z_]{2,16}/,
    [Types.xs]: /^\s{2,8}- xs [a-zA-Z_]{2,16}/,
    [Types.s]: /^\s{2,8}- s [a-zA-Z_]{2,16}/,
    [Types.m]: /^\s{2,8}- m [a-zA-Z_]{2,16}/,
    [Types.l]: /^\s{2,8}- l [a-zA-Z_]{2,16}/,
    [Types.xl]: /^\s{2,8}- xl [a-zA-Z_]{2,16}/,
    [Types.xxl]: /^\s{2,8}- xxl [a-zA-Z_]{2,16}/,
    REFERENCE: /^\s{2,8}- \^ [a-zA-Z_]{2,16}/, // . & | SEARCHED FOR LATER
};

export const ATTRIBUTE_OPTION: {
    [x: string]: RegExp;
} = {
    'PRIMARY KEY': /\+/,
    'DEFAULT NULL': /\?/,
    'NOT NULL': /\!/,
    UNIQUE_GROUP: /[\*]{1,}/,
} as const;
export enum TokenizingState {
    None,
    Table,
    Attribute,
    Schema,
}
export const STATE_CHANGE_TRIGGERS: [RegExp, number][] = [
    [/^- [a-zA-Z_]{2,16}/, TokenizingState.Table],
    [/^## [a-zA-Z_]{2,16}/, TokenizingState.Schema],
] as const;

export class SqlLocation {
    schema: string;
    table: string;
    column: string;
    columnAliasedAs: string | null = null;
    tableAliasedAs: string | null = null;

    constructor(schema: string, table: string, column: string) {
        this.schema = schema;
        this.table = table;
        this.column = column;
    }
}

export type LeftRightJoinInfo = {
    left: {
        table: SqlTable;
        alias: string;
        usingAttributes: SqlTableAttribute[];
    };
    right: {
        table: SqlTable;
        alias: string;
        usingAttributes: SqlTableAttribute[];
    };
};

export class CodeLogicField {
    primary: boolean = false;
    type: Types;
    name: string;
    sqlLocation: SqlLocation;
    readOnly: boolean = false;

    constructor(type: Types, name: string, sqlLocation: SqlLocation, readOnly: boolean) {
        this.type = type;
        this.name = name;
        this.sqlLocation = sqlLocation;
        this.readOnly = readOnly;
    }
}

export enum SQL_INPUT_DISTINCTION {
    Normal,
    InOut,
}

export class JoinedCodePreLogic {
    readTableAs: string | null;
    readAttributeAs: string | null;
    attr: SqlTableAttribute;

    constructor(readAttributeAs: string | null, readTableAs: string | null, attr: SqlTableAttribute) {
        this.readAttributeAs = readAttributeAs;
        this.readTableAs = readTableAs;
        this.attr = attr;
    }
}

export class CodeLogic {
    name: string;
    /**
     * if something can be used as select options, ad a drop down list so to speak
     */
    is_options: boolean = false;
    inputs: CodeLogicField[] = [];
    outputs: CodeLogicField[] = [];

    constructor(name: string) {
        this.name = name;
    }

    sqlInputs(distinction: SQL_INPUT_DISTINCTION) {
        switch (distinction) {
            case SQL_INPUT_DISTINCTION.InOut:
                return this.inputs
                    .filter((e) => e.primary)
                    .map((e) => `INOUT ${e.name} ${e.type}`)
                    .join(',\n    ');
            case SQL_INPUT_DISTINCTION.Normal:
                return this.inputs
                    .filter((e) => !e.primary)
                    .map((e) => `${e.type} ${e.name}`)
                    .join(',\n    ');
            default:
                console.error(new Error('Unknown inputs distinction'));
                return [];
        }
    }

    sqlOutputs() {
        return this.outputs.map((e) => e.name).join(',\n    ');
    }
}

export class TableLogic {
    create: CodeLogic[] | null = null;
    read: CodeLogic[] | null = null;
    update: CodeLogic[] | null = null;
    delete: CodeLogic[] | null = null;

    constructor() {}
}

export class CodeGenerator {
    input: { [x: string]: SqlSchema } = {};
    output: string = '';
    errorMessages: string[] = [];

    constructor() {}

    Clear() {
        this.input = {};
        this.output = '';
        this.errorMessages = [];
        return this;
    }

    /**
     *
     * @param {string} errorMessage
     */
    SaveErrorMessage(errorMessage: string) {
        this.errorMessages.push(errorMessage);
    }

    SetInput(value: { [x: string]: SqlSchema }) {
        this.input = value;
        return this;
    }

    Read() {
        return this.output;
    }

    Run() {
        return this;
    }
}

export class SqlReferenceTo {
    tableAlias: string;
    column: SqlTableAttribute;

    constructor(tableAlias: string, column: SqlTableAttribute) {
        this.tableAlias = tableAlias;
        this.column = column;
    }
}

export class SqlSchema {
    tables: {
        [x: string]: SqlTable;
    } = {};
    options: string[] = [];
    name: string = '';

    constructor(name: string) {
        this.name = name;
    }
}

export class SqlTableAttribute {
    id: number;
    referenceToSelf: boolean = false;
    readOnly: boolean = false;
    value: string = '';
    schemaName: string = '';
    shortHandType: string = '';
    sqlType: Types;
    defaultValue?: string | null = null;
    options = new Set<string>();
    referenceTo: SqlReferenceTo | null = null;
    parentTable: SqlTable;

    constructor(parent: SqlTable, type: Types) {
        this.id = Math.random();
        this.parentTable = parent;
        this.sqlType = type;
    }

    get fullName(): string {
        return `${this.parentTable.parentSchema.name}.${this.parentTable.label}.${this.value}`;
    }

    isPrimaryKey(): boolean {
        return this.options.has('+');
    }
    isForeignKey(): boolean {
        return this.shortHandType === '^' || this.referenceTo !== null;
    }
    isNullable(): boolean {
        return !this.options.has('!');
    }
    isNumerical(): boolean {
        return /^[if]$/.test(this.shortHandType);
    }
    isText(): boolean {
        return /^(xs|s|m|l|xl|xxl)$/.test(this.shortHandType);
    }
    isBool(): boolean {
        return /^[b]$/.test(this.shortHandType);
    }
    isDefaultNull(): boolean {
        return this.options.has('?');
    }
    isModifiable(): boolean {
        let isSerial = this.sqlType === Types.SERIAL;
        return (
            // !this.isPrimaryKey() ||
            !isSerial || (isSerial && this.isForeignKey())
        );
    }
}

export class SqlTable {
    id: number;
    label: string;
    parentSchema: SqlSchema;
    options: string[] = [];
    attributes: {
        [x: string]: SqlTableAttribute;
    } = {};
    logic: TableLogic = {
        create: null,
        read: null,
        update: null,
        delete: null,
    };

    get fullName(): string {
        return `${this.parentSchema.name}.${this.label}`;
    }

    constructor(parent: SqlSchema, label: string) {
        this.parentSchema = parent;
        this.label = label;
        this.id = Math.random();
    }

    primaryKeys(): {
        [x: string]: SqlTableAttribute;
    } {
        let keys: {
            [x: string]: SqlTableAttribute;
        } = {};
        for (const attributeName in this.attributes) {
            if (!Object.prototype.hasOwnProperty.call(this.attributes, attributeName)) {
                continue;
            }
            const attribute = this.attributes[attributeName];
            if (attribute.isPrimaryKey()) {
                keys[attributeName] = attribute;
            }
        }
        return keys;
    }

    hasCompositePrimaryKey(): boolean {
        return Object.keys(this.primaryKeys()).length > 0;
    }

    uniqueGroups(): {
        [x: string]: SqlTableAttribute[];
    } {
        let keys: {
            [x: string]: SqlTableAttribute[];
        } = {};

        for (const attributeName in this.attributes) {
            if (!Object.prototype.hasOwnProperty.call(this.attributes, attributeName)) {
                continue;
            }
            const attribute = this.attributes[attributeName];
            for (const option of attribute.options) {
                if (!/[\*]{1,}/.test(option)) continue;
                if (keys[option]) {
                    if (Object.keys(keys[option]).includes(attributeName)) continue;
                    keys[option].push(attribute);
                } else {
                    keys[option] = [attribute];
                }
            }
        }
        return keys;
    }

    uniqueFkGroups(): Map<SqlTable, SqlTableAttribute[]> {
        let mapped = new Map<SqlTable, SqlTableAttribute[]>();
        let fks = Object.values(this.foreignKeys());
        for (const fk of fks) {
            if (!fk.referenceTo) {
                console.warn('who no reference to on fk?');
                continue;
            }

            let item = mapped.get(fk.referenceTo.column.parentTable);
            if (!item) {
                mapped.set(fk.referenceTo.column.parentTable, [fk]);
            } else {
                item.push(fk);
            }
        }
        return mapped;
    }

    foreignKeys(): {
        [x: string]: SqlTableAttribute;
    } {
        let keys: {
            [x: string]: SqlTableAttribute;
        } = {};
        for (const attributeName in this.attributes) {
            if (!Object.prototype.hasOwnProperty.call(this.attributes, attributeName)) {
                continue;
            }
            const attribute = this.attributes[attributeName];
            if (attribute.isForeignKey()) {
                keys[attributeName] = attribute;
            }
        }
        return keys;
    }

    getModifiableAttributes(): {
        [x: string]: SqlTableAttribute;
    } {
        let keys: {
            [x: string]: SqlTableAttribute;
        } = {};
        for (const attributeName in this.attributes) {
            if (!Object.prototype.hasOwnProperty.call(this.attributes, attributeName)) {
                continue;
            }
            const attribute = this.attributes[attributeName];
            if (attribute.isModifiable()) {
                keys[attributeName] = attribute;
            }
        }
        return keys;
    }

    generateEmptyLogic(): void {
        let answer = new TableLogic();

        let hasCreate = this.options.map((option) => /[C][rR][uU][dD]/.test(option)).includes(true);
        let hasRead = this.options.map((option) => /[cC][R][uU][dD]/.test(option)).includes(true);
        let hasUpdate = this.options.map((option) => /[cC][rR][U][dD]/.test(option)).includes(true);
        let hasDelete = this.options.map((option) => /[cC][rR][uU][D]/.test(option)).includes(true);

        answer.create = hasCreate ? [] : null;
        answer.read = hasRead ? [] : null;
        answer.update = hasUpdate ? [] : null;
        answer.delete = hasDelete ? [] : null;

        this.logic = answer;
    }

    fillInEmptyLogic() {
        let {
            primaryAttrs,
            parameterKeys,
            parameterPrimaryKeys,
            returnedKeys,
        }: {
            primaryAttrs: { [x: string]: SqlTableAttribute };
            parameterKeys: CodeLogicField[];
            parameterPrimaryKeys: CodeLogicField[];
            returnedKeys: CodeLogicField[];
        } = this.GenerateCommonLogicFields();

        if (this.logic.create) {
            let createLogic = this.GenerateCreateLogic(primaryAttrs, parameterKeys);
            this.logic.create.push(createLogic);
        }
        if (this.logic.read) {
            let readSingleLogic = this.GenerateReadSingleLogic(parameterPrimaryKeys, returnedKeys);
            this.logic.read.push(readSingleLogic);

            let readDropdownLogic = this.GenerateReadOptionsLogic();
            if (readDropdownLogic) {
                this.logic.read.push(readDropdownLogic);
            }

            let readJoinedLogic = this.GenerateReadJoinedLogic(parameterPrimaryKeys);
            if (readJoinedLogic) {
                this.logic.read.push(readJoinedLogic);
            }
        }
        if (this.logic.update) {
            let updateLogic = this.GenerateUpdateLogic(parameterPrimaryKeys, parameterKeys);
            this.logic.update.push(updateLogic);
        }
        if (this.logic.delete) {
            let deleteLogic = this.GenerateDeleteLogic(parameterPrimaryKeys);
            this.logic.delete.push(deleteLogic);
        }
    }

    private GenerateDeleteLogic(parameterPrimaryKeys: CodeLogicField[]): CodeLogic {
        let name = `delete_${this.parentSchema.name}_${this.label}`;
        let inputs: CodeLogicField[] = [];

        let logic = new CodeLogic(name);
        inputs = [...parameterPrimaryKeys];
        logic.inputs = [...inputs];
        return logic;
    }

    private GenerateUpdateLogic(parameterPrimaryKeys: CodeLogicField[], parameterKeys: CodeLogicField[]): CodeLogic {
        let name = `update_${this.parentSchema.name}_${this.label}`;
        let inputs: CodeLogicField[] = [];

        let logic = new CodeLogic(name);

        inputs = [...parameterPrimaryKeys, ...parameterKeys.filter((e) => !e.readOnly)];
        // console.log('inputs :>> ', inputs);
        // todo
        logic.inputs = [...inputs];
        return logic;
    }

    private GenerateReadOptionsLogic(): CodeLogic | null {
        let pks = this.primaryKeys();

        // String keys are ordered in the order they were added
        let pkList = Object.values(pks);

        let readableLabels = ['name', 'label', 'value', 'code', 'tag'];
        let simpleAttributeLabel = Object.values(this.attributes).find((x) => readableLabels.includes(x.value.toLowerCase()));
        if (!simpleAttributeLabel) {
            return null;
        }
        if (pkList.map((e) => e.id).includes(simpleAttributeLabel.id)) {
            return null;
        }
        let name = `read_options_${this.parentSchema.name}_${this.label}`;
        let dropdownLogic = new CodeLogic(name);
        dropdownLogic.is_options = true;
        for (let i = 0; i < pkList.length; i++) {
            const pk = pkList[i];
            let outIdentifier = new CodeLogicField(
                pk.sqlType,
                `${PK_PARAM_TAG}${pk.value}`,
                new SqlLocation(this.parentSchema.name, this.label, pk.value),
                false
            );
            outIdentifier.primary = true;
            dropdownLogic.outputs.push(outIdentifier);
        }

        let outLabel = new CodeLogicField(
            simpleAttributeLabel.sqlType,
            `${PK_PARAM_TAG}${simpleAttributeLabel.value}`,
            new SqlLocation(this.parentSchema.name, this.label, simpleAttributeLabel.value),
            false
        );
        dropdownLogic.inputs = [];
        dropdownLogic.outputs.push(outLabel);

        return dropdownLogic;
    }

    private GenerateReadSingleLogic(parameterPrimaryKeys: CodeLogicField[], returnedKeys: CodeLogicField[]): CodeLogic {
        let name = `read_single_${this.parentSchema.name}_${this.label}`;
        let inputs: CodeLogicField[] = [];
        let outputs: CodeLogicField[] = [];

        inputs = [...parameterPrimaryKeys];
        outputs = [...returnedKeys];

        let logic = new CodeLogic(name);
        logic.inputs = [...inputs];
        logic.outputs = [...outputs];
        return logic;
    }

    static ReadJoins(inputTable: SqlTable, collection: Array<LeftRightJoinInfo> = [], i: number = 0, nestedCount: number = 0): Array<LeftRightJoinInfo> | null {
        if (i > MAX_SEARCH_NESTED_COUNT) {
            console.error('exceeded max loop count on getting attribute and its referenced attributes');
            return null;
        }

        if (nestedCount >= JOIN_DEPTH) {
            return null;
        }

        let groups = inputTable.uniqueFkGroups();

        if (groups.size === 0) {
            return null;
        }

        // let t2: SqlTable = attr.referenceTo!.column.parentTable;
        let leftTable: SqlTable = inputTable;
        let leftTableAlias = '';
        let tableSlicedName2 = leftTable.label.slice(0, 3);
        leftTableAlias = `${tableSlicedName2}_${i}`;

        for (const [rightTable, leftTableAttributeToUse] of leftTable.uniqueFkGroups()) {
            const leftAttr = leftTableAttributeToUse[0]; // We only care about a single fk, handling composite fk

            if (leftAttr.referenceToSelf) {
                nestedCount += 1;
            }

            let rightTableAlias = '';
            let tableSlicedName = rightTable.label.slice(0, 3);
            rightTableAlias = `${tableSlicedName}_${i + 1}`;

            let aJoin: LeftRightJoinInfo = {
                left: {
                    table: leftTable,
                    alias: leftTableAlias,
                    usingAttributes: leftTableAttributeToUse,
                },
                right: {
                    table: rightTable,
                    alias: rightTableAlias,
                    usingAttributes: leftTableAttributeToUse.map((e) => e.referenceTo!.column),
                },
            };

            collection.push(aJoin);

            SqlTable.ReadJoins(rightTable, collection, i + 1, nestedCount);
        }

        if (collection.length === 0) {
            return null;
        }

        return collection;
    }

    private static ReadAttributes(
        inputTable: SqlTable,
        collection: Array<JoinedCodePreLogic> = [],
        i: number = 0,
        aliasInput: string | null = '',
        nestedCount: number = 0
    ): Array<JoinedCodePreLogic> | null {
        if (i > MAX_SEARCH_NESTED_COUNT) {
            console.error('exceeded max loop count on getting attribute and its referenced attributes');
            return null;
        }

        if (nestedCount >= JOIN_DEPTH) {
            return null;
        }

        let typicalAttrs = Object.values(inputTable.attributes).filter((e) => !e.isForeignKey());

        for (let k = 0; k < typicalAttrs.length; k++) {
            const typicalAttr = typicalAttrs[k];
            let joinAsParts = [typicalAttr.parentTable.label, typicalAttr.value];
            if (aliasInput) {
                joinAsParts.unshift(aliasInput);
            }
            let readAttributeAs = joinAsParts.join('_');
            let readTableAs = '';
            let tableSlicedName = typicalAttr.parentTable.label.slice(0, 3);
            readTableAs = `${tableSlicedName}_${i}`;

            let joinedCodePreLogic = new JoinedCodePreLogic(readAttributeAs, readTableAs, typicalAttr);
            collection.push(joinedCodePreLogic);
        }

        for (const [table, attrs] of inputTable.uniqueFkGroups()) {
            let attr = attrs[0]; // We only care about a single fk, handling composite fk

            // if (attr.value === 'person_first_name') {
            //     console.log('attr :>> ', attr);
            // }

            if (attr.referenceToSelf) {
                nestedCount += 1;
            }

            let parts = [];
            if (nestedCount) {
                parts.push(`depth_${nestedCount}`);
            }
            // parts.push(attr.value)
            if (attr.parentTable.id !== table.id) {
                // parts.push("via")
                parts.push(inputTable.label);
            }

            SqlTable.ReadAttributes(table, collection, i + 1, parts.join('_'), nestedCount);
        }

        return collection;
    }

    private GenerateReadJoinedLogic(parameterPrimaryKeys: CodeLogicField[]): CodeLogic | null {
        let name = `read_joined_${this.parentSchema.name}_${this.label}`;
        let logic = new CodeLogic(name);

        let inputs: CodeLogicField[] = [];
        let outputs: CodeLogicField[] = [];

        inputs = [...parameterPrimaryKeys];

        let attributeToRead = SqlTable.ReadAttributes(this);

        if (!attributeToRead || Object.keys(this.attributes).length === attributeToRead.length) {
            return null;
        }

        for (const attrRead of attributeToRead) {
            const attr = attrRead.attr;
            let sqlLocation = new SqlLocation(attr.parentTable.parentSchema.name, attr.parentTable.label, attr.value);
            if (attrRead.readAttributeAs) {
                sqlLocation.columnAliasedAs = attrRead.readAttributeAs;
            }
            if (attrRead.readTableAs) {
                sqlLocation.tableAliasedAs = attrRead.readTableAs;
            }

            let codeLogic = new CodeLogicField(attr.sqlType, `${PARAM_PREFIX}${attr.value}`, sqlLocation, attr.readOnly);
            outputs.push(codeLogic);
        }

        logic.inputs = [...inputs];
        logic.outputs = [...outputs];

        return logic;
    }

    private GenerateCreateLogic(primaryAttrs: { [x: string]: SqlTableAttribute }, parameterKeys: CodeLogicField[]): CodeLogic {
        let name = `create_${this.parentSchema.name}_${this.label}`;
        let inputs: CodeLogicField[] = [];
        let outputs: CodeLogicField[] = [];

        let inOuts: Array<CodeLogicField> = [];
        for (const attributeName in primaryAttrs) {
            if (!Object.prototype.hasOwnProperty.call(primaryAttrs, attributeName)) {
                continue;
            }
            const primaryKey = primaryAttrs[attributeName];
            let pk = new CodeLogicField(
                primaryKey.sqlType,
                `${IN_OUT_PREFIX}${primaryKey.value}`,
                new SqlLocation(this.parentSchema.name, this.label, primaryKey.value),
                primaryKey.readOnly
            );
            pk.primary = true;
            inOuts.push(pk);
        }

        inputs = [...inOuts, ...parameterKeys];
        outputs = [...inOuts];

        let logic = new CodeLogic(name);
        logic.inputs = [...inputs];
        logic.outputs = [...outputs];
        return logic;
    }

    private GenerateCommonLogicFields() {
        let parameterPrimaryKeys: CodeLogicField[] = [];
        let parameterKeys: CodeLogicField[] = [];
        let returnedKeys: CodeLogicField[] = [];

        let primaryAttrs = this.primaryKeys();

        for (const attributeName in primaryAttrs) {
            if (!Object.prototype.hasOwnProperty.call(primaryAttrs, attributeName)) {
                continue;
            }
            const primaryKey = primaryAttrs[attributeName];
            let pk = new CodeLogicField(
                primaryKey.sqlType,
                `${PK_PARAM_TAG}${primaryKey.value}`,
                new SqlLocation(this.parentSchema.name, this.label, primaryKey.value),
                primaryKey.readOnly
            );
            pk.primary = true;
            parameterPrimaryKeys.push(pk);
        }

        let modifiableAttrs = this.getModifiableAttributes();
        for (const attributeName in modifiableAttrs) {
            if (!Object.prototype.hasOwnProperty.call(modifiableAttrs, attributeName)) {
                continue;
            }
            const attr = modifiableAttrs[attributeName];
            if (!attr.sqlType) {
                continue;
            }
            let param = new CodeLogicField(
                attr.sqlType,
                `${PARAM_PREFIX}${attr.value}`,
                new SqlLocation(this.parentSchema.name, this.label, attr.value),
                attr.readOnly
            );
            parameterKeys.push(param);
            let returned = new CodeLogicField(
                attr.sqlType,
                `${PARAM_PREFIX}${attr.value}`,
                new SqlLocation(this.parentSchema.name, this.label, attr.value),
                attr.readOnly
            );
            returnedKeys.push(returned);
        }

        return {
            primaryAttrs,
            parameterKeys,
            parameterPrimaryKeys,
            returnedKeys,
        };
    }

    hasPrimaryKey(): boolean {
        return Object.keys(this.primaryKeys()).length > 0;
    }
    hasForeignKey(): boolean {
        return Object.keys(this.foreignKeys()).length > 0;
    }
}
