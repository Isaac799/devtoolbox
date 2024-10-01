import { SnakeToCamel, SnakeToKebab, SnakeToPascal, SnakeToTitle, trimAndRemoveBlankStrings } from './formatting';

export const PK_PARAM_TAG = 'target_';
export const PARAM_PREFIX = 'new_';
export const FK_PREFIX = 'fk';
const IN_OUT_PREFIX = 'in_out_';
export const UNALIASED_SELF_REFERENCE_ALIAS = 'self_';

export type FileOutputs = {
        [x: string]: string;
};

// export interface NestedFileOutputs {
//         [key: string]: NestedFileOutputs | FileOutputs[];
// }

/**
 * Determines the max depth of joins to make for self references
 */
export const JOIN_DEPTH = 2 as const;

export enum SqlType {
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
        [SqlType.BIT]: /^\s{2,8}- bit [a-zA-Z_]{2,16}/,
        [SqlType.DECIMAL]: /^\s{2,8}- (d|dec|decimal) [a-zA-Z_]{2,16}/,
        [SqlType.DATE]: /^\s{2,8}- (dt|date) [a-zA-Z_]{2,16}/,
        [SqlType.CHAR]: /^\s{2,8}- (c|char|character) [a-zA-Z_]{2,16}/,
        [SqlType.TIME]: /^\s{2,8}- (t|time) [a-zA-Z_]{2,16}/,
        [SqlType.TIMESTAMP]: /^\s{2,8}- (ts|timestamp) [a-zA-Z_]{2,16}/,
        [SqlType.FLOAT]: /^\s{2,8}- (f|float) [a-zA-Z_]{2,16}/,
        [SqlType.REAL]: /^\s{2,8}- (r|real) [a-zA-Z_]{2,16}/,
        [SqlType.INT]: /^\s{2,8}- (i|int|integer) [a-zA-Z_]{2,16}/,
        [SqlType.BOOLEAN]: /^\s{2,8}- (b|boolean|bool) [a-zA-Z_]{2,16}/,
        [SqlType.xs]: /^\s{2,8}- xs [a-zA-Z_]{2,16}/,
        [SqlType.s]: /^\s{2,8}- s [a-zA-Z_]{2,16}/,
        [SqlType.m]: /^\s{2,8}- m [a-zA-Z_]{2,16}/,
        [SqlType.l]: /^\s{2,8}- l [a-zA-Z_]{2,16}/,
        [SqlType.xl]: /^\s{2,8}- xl [a-zA-Z_]{2,16}/,
        [SqlType.xxl]: /^\s{2,8}- xxl [a-zA-Z_]{2,16}/,
        REFERENCE: /^\s{2,8}- \^ [a-zA-Z_]{2,16}/, // . & | SEARCHED FOR LATER
};

export const SQL_TO_TS_TYPE = {
        [SqlType.BIT]: 'boolean',
        [SqlType.DATE]: 'Date',
        [SqlType.CHAR]: 'string',
        [SqlType.TIME]: 'Date',
        [SqlType.TIMESTAMP]: 'Date',
        [SqlType.SERIAL]: 'number',
        [SqlType.DECIMAL]: 'number',
        [SqlType.FLOAT]: 'number',
        [SqlType.REAL]: 'number',
        [SqlType.INT]: 'number',
        [SqlType.BOOLEAN]: 'boolean',
        [SqlType.xs]: 'string',
        [SqlType.s]: 'string',
        [SqlType.m]: 'string',
        [SqlType.l]: 'string',
        [SqlType.xl]: 'string',
        [SqlType.xxl]: 'string',
};

type goHtmlInputFunction = (x: SqlTableAttribute, setValueToThisAttribute?: string) => string;

const stringHtmlInputFunctionForGo: goHtmlInputFunction = (x, y) => `<div class="field">
            <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
            <div class="control">
                <input
                    class="input"
                    type="${SQL_TO_HTML_INPUT_TYPE[SqlType.s]}"
                    id="${x.value}"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${y ? `\n                    value="${y}"` : ''}
                />
            </div>
        </div>`;

export const SQL_TO_GO_TYPE: Record<string, { goType: string; parseFunction: (x: string) => string; htmlInputFunction: goHtmlInputFunction }> = {
        [SqlType.BIT]: {
                goType: 'bool',
                parseFunction: (x) => `strconv.ParseBool(${x})`,
                htmlInputFunction: (x, y) => `<div class="field">
            <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
            <div class="control">
                <input
                    class="input"
                    type="${SQL_TO_HTML_INPUT_TYPE[SqlType.BIT]}"
                    id="${x.value}"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${y ? `\n                    value="${y}"` : ''}
                />
            </div>
        </div>`,
        },
        [SqlType.DATE]: {
                goType: 'time.Time',
                parseFunction: (x) => `time.Parse("2006-01-02", ${x})`,
                htmlInputFunction: (x, y) => `<div class="field">
            <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
            <div class="control">
                <input
                    class="input"
                    type="${SQL_TO_HTML_INPUT_TYPE[SqlType.DATE]}"
                    id="${x.value}"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${y ? `\n                    value="${y}"` : ''}
                />
            </div>
        </div>`,
        },
        [SqlType.CHAR]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                htmlInputFunction: (x, y) => `<div class="field">
            <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
            <div class="control">
                <input
                    class="input"
                    type="${SQL_TO_HTML_INPUT_TYPE[SqlType.CHAR]}"
                    id="${x.value}"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${y ? `\n                    value="${y}"` : ''}
                />
            </div>
        </div>`,
        },
        [SqlType.TIME]: {
                goType: 'time.Time',
                parseFunction: (x) => `time.Parse("15:04:05", ${x})`,
                htmlInputFunction: (x, y) => `<div class="field">
            <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
            <div class="control">
                <input
                    class="input"
                    type="${SQL_TO_HTML_INPUT_TYPE[SqlType.TIME]}"
                    id="${x.value}"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${y ? `\n                    value="${y}"` : ''}
                />
            </div>
        </div>`,
        },
        [SqlType.TIMESTAMP]: {
                goType: 'time.Time',
                parseFunction: (x) => `time.Parse("2006-01-02 15:04:05", ${x})`,
                htmlInputFunction: (x, y) => `<div class="field">
            <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
            <div class="control">
                <input
                    class="input"
                    type="${SQL_TO_HTML_INPUT_TYPE[SqlType.TIMESTAMP]}"
                    id="${x.value}"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${y ? `\n                    value="${y}"` : ''}
                />
            </div>
        </div>`,
        },
        [SqlType.SERIAL]: {
                goType: 'int',
                parseFunction: (x) => `strconv.Atoi(${x})`,
                htmlInputFunction: (x, y) => `<div class="field">
            <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
            <div class="control">
                <input
                    class="input"
                    type="${SQL_TO_HTML_INPUT_TYPE[SqlType.SERIAL]}"
                    id="${x.value}"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${y ? `\n                    value="${y}"` : ''}
                />
            </div>
        </div>`,
        },
        [SqlType.DECIMAL]: {
                goType: 'float64',
                parseFunction: (x) => `strconv.ParseFloat(${x})`,
                htmlInputFunction: (x, y) => `<div class="field">
            <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
            <div class="control">
                <input
                    class="input"
                    type="${SQL_TO_HTML_INPUT_TYPE[SqlType.DECIMAL]}"
                    id="${x.value}"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${y ? `\n                    value="${y}"` : ''}
                />
            </div>
        </div>`,
        },
        [SqlType.FLOAT]: {
                goType: 'float64',
                parseFunction: (x) => `strconv.ParseFloat(${x})`,
                htmlInputFunction: (x, y) => `<div class="field">
            <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
            <div class="control">
                <input
                    class="input"
                    type="${SQL_TO_HTML_INPUT_TYPE[SqlType.FLOAT]}"
                    id="${x.value}"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${y ? `\n                    value="${y}"` : ''}
                />
            </div>
        </div>`,
        },
        [SqlType.REAL]: {
                goType: 'float64',
                parseFunction: (x) => `strconv.ParseFloat(${x})`,
                htmlInputFunction: (x, y) => `<div class="field">
            <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
            <div class="control">
                <input
                    class="input"
                    type="${SQL_TO_HTML_INPUT_TYPE[SqlType.REAL]}"
                    id="${x.value}"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${y ? `\n                    value="${y}"` : ''}
                />
            </div>
        </div>`,
        },
        [SqlType.INT]: {
                goType: 'int',
                parseFunction: (x) => `strconv.Atoi(${x})`,
                htmlInputFunction: (x, y) => `<div class="field">
            <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
            <div class="control">
                <input
                    class="input"
                    type="${SQL_TO_HTML_INPUT_TYPE[SqlType.INT]}"
                    id="${x.value}"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${y ? `\n                    value="${y}"` : ''}
                />
            </div>
        </div>`,
        },
        [SqlType.BOOLEAN]: {
                goType: 'bool',
                parseFunction: (x) => `strconv.ParseBool(${x})`,
                htmlInputFunction: (x, y) => `<div class="field">
            <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
            <div class="control">
                <input
                    class="input"
                    type="${SQL_TO_HTML_INPUT_TYPE[SqlType.BOOLEAN]}"
                    id="${x.value}"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${y ? `\n                    value="${y}"` : ''}
                />
            </div>
        </div>`,
        },
        [SqlType.xs]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                htmlInputFunction: stringHtmlInputFunctionForGo,
        },
        [SqlType.s]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                htmlInputFunction: stringHtmlInputFunctionForGo,
        },
        [SqlType.m]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                htmlInputFunction: stringHtmlInputFunctionForGo,
        },
        [SqlType.l]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                htmlInputFunction: stringHtmlInputFunctionForGo,
        },
        [SqlType.xl]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                htmlInputFunction: stringHtmlInputFunctionForGo,
        },
        [SqlType.xxl]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                htmlInputFunction: stringHtmlInputFunctionForGo,
        },
};

export const SQL_TO_HTML_INPUT_TYPE = {
        [SqlType.BIT]: 'checkbox',
        [SqlType.DATE]: 'date',
        [SqlType.CHAR]: 'text',
        [SqlType.TIME]: 'time',
        [SqlType.TIMESTAMP]: 'datetime-local',
        [SqlType.SERIAL]: 'number',
        [SqlType.DECIMAL]: 'number',
        [SqlType.FLOAT]: 'number',
        [SqlType.REAL]: 'number',
        [SqlType.INT]: 'number',
        [SqlType.BOOLEAN]: 'checkbox',
        [SqlType.xs]: 'text',
        [SqlType.s]: 'text',
        [SqlType.m]: 'text',
        [SqlType.l]: 'text',
        [SqlType.xl]: 'text',
        [SqlType.xxl]: 'text',
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

export class EndpointParam {
        typescript: {
                name: string;
                type: string;
        };
        go: {
                varName: string;
                typeName: string;
                typeType: string;
                parser: (x: string) => string;
        };
        sql: {
                name: string;
                type: string;
                sqlLocation: SqlLocation;
        };
        json: {
                name: string;
                type: string;
        };
        html: {
                name: string;
                type: string;
        };

        readOnly: boolean = false;

        constructor(type: SqlType, name: string, sqlLocation: SqlLocation, readOnly: boolean) {
                this.readOnly = readOnly;

                this.typescript = {
                        name: SnakeToCamel(name),
                        type: SQL_TO_TS_TYPE[type],
                };
                this.go = {
                        varName: SnakeToCamel(name),
                        typeName: SnakeToPascal(name),
                        typeType: SQL_TO_GO_TYPE[type].goType,
                        parser: SQL_TO_GO_TYPE[type].parseFunction,
                };
                this.json = {
                        name: name,
                        type: type,
                };
                this.sql = {
                        name: name,
                        type: type,
                        sqlLocation: sqlLocation,
                };
                this.html = {
                        name: SnakeToTitle(name),
                        type: SQL_TO_HTML_INPUT_TYPE[type],
                };
        }
}

export class JoinedCodePreEndpoint {
        readTableAs: string | null;
        readAttributeAs: string | null;
        attr: SqlTableAttribute;

        constructor(readAttributeAs: string | null, readTableAs: string | null, attr: SqlTableAttribute) {
                this.readAttributeAs = readAttributeAs;
                this.readTableAs = readTableAs;
                this.attr = attr;
        }
}

export enum HttpMethod {
        GET = 'GET',
        POST = 'POST',
        PUT = 'PUT',
        DELETE = 'DELETE',
}

export const HttpMethodToHtmlName = (x: HttpMethod, many: boolean) => {
        switch (x) {
                case HttpMethod.GET:
                        if (many) {
                                return 'index';
                        } else {
                                return 'show';
                        }
                case HttpMethod.POST:
                        return 'new';
                case HttpMethod.PUT:
                        return 'edit';
                case HttpMethod.DELETE:
                        return 'delete';
        }
};

export class Endpoint {
        method: HttpMethod;
        /**
         * if something can be used as select options, ad a drop down list so to speak
         */
        isOptions: boolean = false;
        many: boolean = false;
        sqlTableName: string;
        sqlSchemaName: string;
        primaryKeyName: string;
        primaryKeyEndpointParam: EndpointParam;
        routerFuncName: string;
        routerFuncApiName: string;

        sql: {
                inout: EndpointParam[];
                inputs: EndpointParam[];
                outputs: EndpointParam[];
                name: string;
        } = {
                inout: [],
                inputs: [],
                outputs: [],
                name: '',
        };
        http: {
                query: EndpointParam[];
                path: EndpointParam[];
                bodyIn: EndpointParam[];
                bodyOut: EndpointParam[];
                name: string;
        } = {
                query: [],
                path: [],
                bodyIn: [],
                bodyOut: [],
                name: '',
        };
        typescript: {
                fnName: string;
                input: {
                        name: string;
                        type: string;
                };
                output: {
                        name: string;
                        type: string;
                };
                real: {
                        name: string;
                        type: string;
                };
        };
        go: {
                fnName: string;
                input: {
                        varName: string;
                        typeName: string;
                        typeType: string;
                };
                output: {
                        varName: string;
                        typeName: string;
                        typeType: string;
                };
                real: {
                        name: string;
                        type: string;
                };
        };

        get path() {
                // let endpointPath = `/${this.sqlSchemaName}/${this.go.real.name}`;
                let endpointPath = `/${this.go.real.name}`;
                if (!this.many && this.method !== HttpMethod.POST) {
                        endpointPath += `/{${this.primaryKeyName}}`;
                }
                return endpointPath;
        }

        constructor(method: HttpMethod, name: string, table: SqlTable, many: boolean, sqlTableAttribute: SqlTableAttribute) {
                this.http.name = name;
                this.primaryKeyName = sqlTableAttribute.value;
                this.primaryKeyEndpointParam = new EndpointParam(
                        sqlTableAttribute.sqlType,
                        sqlTableAttribute.value,
                        new SqlLocation(sqlTableAttribute.parentTable.parentSchema.name, sqlTableAttribute.parentTable.label, sqlTableAttribute.value),
                        sqlTableAttribute.readOnly
                );

                this.sql.name = `${method.toLowerCase()}_${name}`;
                if (many) {
                        this.sql.name += 's';
                }
                this.method = method;
                this.many = many;
                const tableL = table.label;
                this.sqlTableName = table.label + 's';
                this.sqlSchemaName = table.parentSchema.name;
                this.routerFuncName = SnakeToPascal(`${HttpMethodToHtmlName(this.method, many)}_${table.label}`);
                this.routerFuncApiName = SnakeToPascal(`api_${HttpMethodToHtmlName(this.method, many)}_${table.label}`);

                this.typescript = {
                        fnName: SnakeToCamel(this.sql.name),
                        input: {
                                name: SnakeToCamel(`${name}`),
                                type: SnakeToCamel(`${name}`),
                        },
                        output: {
                                name: SnakeToCamel(`${name}`),
                                type: SnakeToCamel(`${name}`),
                        },
                        real: {
                                name: SnakeToCamel(tableL),
                                type: SnakeToCamel(tableL),
                        },
                };
                this.go = {
                        fnName: SnakeToPascal(this.sql.name),
                        input: {
                                varName: SnakeToCamel(`${name}`),
                                typeName: SnakeToPascal(`${name}`),
                                typeType: SnakeToPascal(`${name}`),
                        },
                        output: {
                                varName: SnakeToCamel(`${name}`),
                                typeName: SnakeToPascal(`${name}`),
                                typeType: SnakeToPascal(`${name}`),
                        },
                        real: {
                                name: SnakeToKebab(tableL),
                                type: SnakeToPascal(tableL),
                        },
                };
        }

        sqlOutputs() {
                return this.sql.outputs.map((e) => e.sql.name).join(',\n    ');
        }

        get url() {
                // let endpointPath = `/${this.sqlSchemaName}/${SnakeToKebab(this.sqlTableName)}`;
                let endpointPath = `/${SnakeToKebab(this.sqlTableName)}`;
                return endpointPath;
        }
}

export class EndpointGoShow {
        readonly method: HttpMethod = HttpMethod.GET;

        routerFuncName: string;
        sqlTableName: string;
        sqlSchemaName: string;
        primaryKeyName: string;
        propertyNames: string[];
        sqlAttributes: SqlTableAttribute[];

        get url() {
                // let endpointPath = `/${this.sqlSchemaName}/${SnakeToKebab(this.sqlTableName)}`;
                let endpointPath = `/${SnakeToKebab(this.sqlTableName)}`;
                return endpointPath;
        }

        filePath(kind: 'show' | 'new' | 'edit' | 'index') {
                let endpointPath = `/web/templates/${this.sqlTableName}/${kind}.html`;
                // let endpointPath = `/templates/${this.sqlSchemaName}/${this.sqlTableName}/${kind}.html`;
                return endpointPath;
        }

        constructor(table: SqlTable, primaryKeyName: string, propertyNames: string[]) {
                this.propertyNames = propertyNames.map((e) => SnakeToPascal(e));
                this.sqlAttributes = Object.values(table.attributes);
                this.primaryKeyName = SnakeToPascal(primaryKeyName);
                this.routerFuncName = SnakeToPascal(`${HttpMethodToHtmlName(this.method, false)}_${table.label}`);
                this.sqlTableName = table.label + 's';
                this.sqlSchemaName = table.parentSchema.name;
        }
}

export class EntityEndpoints {
        existsAs: EndpointParam[] = [];

        goShow: EndpointGoShow | null = null;
        create: Endpoint[] | null = null;
        read: Endpoint[] | null = null;
        update: Endpoint[] | null = null;
        delete: Endpoint[] | null = null;

        constructor() {}
}

export class CodeGenerator {
        input: { [x: string]: SqlSchema } = {};
        output: FileOutputs = {};
        errorMessages: string[] = [];

        constructor() {}

        Clear() {
                this.input = {};
                this.output = {};
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
                return trimAndRemoveBlankStrings(this.output);
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
        sqlType: SqlType;
        defaultValue?: string | null = null;
        options = new Set<string>();
        referenceTo: SqlReferenceTo | null = null;
        parentTable: SqlTable;

        constructor(parent: SqlTable, type: SqlType) {
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
                let isSerial = this.sqlType === SqlType.SERIAL;
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

        endpoints: EntityEndpoints = {
                goShow: null,
                existsAs: [],
                create: null,
                read: null,
                update: null,
                delete: null,
        };

        get fullName(): string {
                return `${this.parentSchema.name}.${this.label}`;
        }

        get desiresCRUD(): boolean {
                return !!this.endpoints.create || !!this.endpoints.read || !!this.endpoints.update || !!this.endpoints.delete;
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
                return Object.keys(this.primaryKeys()).length > 1;
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

        generateEmptyEndpoints() {
                let answer = new EntityEndpoints();

                // let hasCreate = this.options.map((option) => /[C][rR][uU][dD]/.test(option)).includes(true);
                // let hasRead = this.options.map((option) => /[cC][R][uU][dD]/.test(option)).includes(true);
                // let hasUpdate = this.options.map((option) => /[cC][rR][U][dD]/.test(option)).includes(true);
                // let hasDelete = this.options.map((option) => /[cC][rR][uU][D]/.test(option)).includes(true);
                // const desireCRUD = hasCreate || hasRead || hasUpdate || hasDelete;

                // if (!desireCRUD) return;

                // if (hasCreate) answer.create = [];
                // if (hasRead) answer.read = [];
                // if (hasUpdate) answer.update = [];
                // if (hasDelete) answer.delete = [];

                answer.create = [];
                answer.read = [];
                answer.update = [];
                answer.delete = [];

                this.endpoints = answer;
        }

        generateEndpoints() {
                let primaryKeys = Object.values(this.primaryKeys());
                if (primaryKeys.length !== 1) {
                        return;
                }
                let firstPrimaryKey = primaryKeys[0];

                if (!this.desiresCRUD) return;

                let primaryInOutAttrs = Object.values(this.primaryKeys()).map((e) => {
                        return new EndpointParam(
                                e.sqlType,
                                `${IN_OUT_PREFIX}${e.value}`,
                                new SqlLocation(e.parentTable.parentSchema.name, e.parentTable.label, e.value),
                                e.readOnly
                        );
                });
                let primaryAttrs = Object.values(this.primaryKeys()).map((e) => {
                        return new EndpointParam(
                                e.sqlType,
                                e.value,
                                new SqlLocation(e.parentTable.parentSchema.name, e.parentTable.label, e.value),
                                e.readOnly
                        );
                });
                let allAttrs = Object.values(this.attributes).map((e) => {
                        return new EndpointParam(
                                e.sqlType,
                                e.value,
                                new SqlLocation(e.parentTable.parentSchema.name, e.parentTable.label, e.value),
                                e.readOnly
                        );
                });
                // let simpleAttrs = Object.values(this.attributes)
                //         .filter((e) => ['name', 'label', 'value', 'code', 'title', 'tag'].includes(e.value))
                //         .map((e) => {
                //                 return new EndpointParam(
                //                         e.sqlType,
                //                         e.value,
                //                         new SqlLocation(e.parentTable.parentSchema.name, e.parentTable.label, e.value),
                //                         e.readOnly
                //                 );
                //         });
                let nonPrimaryAttrs = Object.values(this.attributes)
                        .filter((e) => !e.isPrimaryKey())
                        .map((e) => {
                                return new EndpointParam(
                                        e.sqlType,
                                        e.value,
                                        new SqlLocation(e.parentTable.parentSchema.name, e.parentTable.label, e.value),
                                        e.readOnly
                                );
                        });

                let goAttributeNames = allAttrs.map((e) => e.go.varName);
                this.endpoints.goShow = new EndpointGoShow(this, firstPrimaryKey.value, goAttributeNames);
                if (this.endpoints.create) {
                        let o = new Endpoint(HttpMethod.POST, this.label, this, false, firstPrimaryKey);
                        o.sql.inout = [...primaryInOutAttrs];
                        o.sql.inputs = [...nonPrimaryAttrs];
                        o.http.bodyIn = [...nonPrimaryAttrs];
                        o.sql.outputs = [...primaryInOutAttrs];
                        o.http.bodyOut = [...allAttrs];
                        this.endpoints.create.push(o);
                }
                if (this.endpoints.read) {
                        let readSingle = new Endpoint(HttpMethod.GET, this.label, this, false, firstPrimaryKey);
                        readSingle.sql.inputs = [...primaryAttrs];
                        readSingle.http.path = [...primaryAttrs];
                        readSingle.sql.outputs = [...allAttrs];
                        readSingle.http.bodyOut = [...allAttrs];
                        this.endpoints.read.push(readSingle);

                        // if (simpleAttrs.length > 0) {
                        //         let readOptions = new Endpoint(HttpMethod.GET, `options_${this.label}`, this, true, firstPrimaryKey);
                        //         readOptions.sql.inputs = [];
                        //         readOptions.http.path = [];
                        //         readOptions.sql.outputs = [...primaryAttrs, ...simpleAttrs];
                        //         readOptions.http.bodyOut = [...primaryAttrs, ...simpleAttrs];
                        //         this.entityEndpoints.read.push(readOptions);
                        // }

                        let readEverything = new Endpoint(HttpMethod.GET, this.label, this, true, firstPrimaryKey);
                        readEverything.sql.inputs = [];
                        readEverything.http.path = [];
                        readEverything.sql.outputs = [...allAttrs];
                        readEverything.http.bodyOut = [...allAttrs];
                        this.endpoints.read.push(readEverything);
                }
                if (this.endpoints.update) {
                        let o = new Endpoint(HttpMethod.PUT, this.label, this, false, firstPrimaryKey);
                        o.sql.inout = [...primaryInOutAttrs];
                        o.sql.inputs = [...nonPrimaryAttrs];
                        o.http.bodyIn = [...nonPrimaryAttrs];
                        o.http.path = [...primaryAttrs];

                        o.sql.outputs = [];
                        o.http.bodyOut = [];
                        this.endpoints.update.push(o);
                }
                if (this.endpoints.delete) {
                        let o = new Endpoint(HttpMethod.DELETE, this.label, this, false, firstPrimaryKey);
                        o.sql.inputs = [...primaryAttrs];
                        o.http.path = [...primaryAttrs];
                        this.endpoints.delete.push(o);
                }
        }

        static ReadJoins(
                inputTable: SqlTable,
                collection: Array<LeftRightJoinInfo> = [],
                i: number = 0,
                nestedCount: number = 0
        ): Array<LeftRightJoinInfo> | null {
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

        // private static ReadAttributes(
        //         inputTable: SqlTable,
        //         collection: Array<JoinedCodePreEndpoint> = [],
        //         i: number = 0,
        //         aliasInput: string | null = '',
        //         nestedCount: number = 0
        // ): Array<JoinedCodePreEndpoint> | null {
        //         if (i > MAX_SEARCH_NESTED_COUNT) {
        //                 console.error('exceeded max loop count on getting attribute and its referenced attributes');
        //                 return null;
        //         }

        //         if (nestedCount >= JOIN_DEPTH) {
        //                 return null;
        //         }

        //         let typicalAttrs = Object.values(inputTable.attributes).filter((e) => !e.isForeignKey());

        //         for (let k = 0; k < typicalAttrs.length; k++) {
        //                 const typicalAttr = typicalAttrs[k];
        //                 let joinAsParts = [typicalAttr.parentTable.label, typicalAttr.value];
        //                 if (aliasInput) {
        //                         joinAsParts.unshift(aliasInput);
        //                 }
        //                 let readAttributeAs = joinAsParts.join('_');
        //                 let readTableAs = '';
        //                 let tableSlicedName = typicalAttr.parentTable.label.slice(0, 3);
        //                 readTableAs = `${tableSlicedName}_${i}`;

        //                 let joinedCodePreEndpoint = new JoinedCodePreEndpoint(readAttributeAs, readTableAs, typicalAttr);
        //                 collection.push(joinedCodePreEndpoint);
        //         }

        //         for (const [table, attrs] of inputTable.uniqueFkGroups()) {
        //                 let attr = attrs[0]; // We only care about a single fk, handling composite fk

        //                 // if (attr.value === 'person_first_name') {
        //                 //     console.log('attr :>> ', attr);
        //                 // }

        //                 if (attr.referenceToSelf) {
        //                         nestedCount += 1;
        //                 }

        //                 let parts = [];
        //                 if (nestedCount) {
        //                         parts.push(`depth_${nestedCount}`);
        //                 }
        //                 // parts.push(attr.value)
        //                 if (attr.parentTable.id !== table.id) {
        //                         // parts.push("via")
        //                         parts.push(inputTable.label);
        //                 }

        //                 SqlTable.ReadAttributes(table, collection, i + 1, parts.join('_'), nestedCount);
        //         }

        //         return collection;
        // }

        // private GenerateReadJoinedEndpoint(parameterPrimaryKeys: CodeEndpointField[]): CodeEndpoint | null {
        //         let name = `read_joined_${this.label}`;
        //         let endpoint = new CodeEndpoint(name, this);

        //         let inputs: CodeEndpointField[] = [];
        //         let outputs: CodeEndpointField[] = [];

        //         inputs = [...parameterPrimaryKeys];

        //         let attributeToRead = SqlTable.ReadAttributes(this);

        //         if (!attributeToRead || Object.keys(this.attributes).length === attributeToRead.length) {
        //                 return null;
        //         }

        //         for (const attrRead of attributeToRead) {
        //                 const attr = attrRead.attr;
        //                 let sqlLocation = new SqlLocation(attr.parentTable.parentSchema.name, attr.parentTable.label, attr.value);
        //                 if (attrRead.readAttributeAs) {
        //                         sqlLocation.columnAliasedAs = attrRead.readAttributeAs;
        //                 }
        //                 if (attrRead.readTableAs) {
        //                         sqlLocation.tableAliasedAs = attrRead.readTableAs;
        //                 }

        //                 let codeEndpoint = new CodeEndpointField(attr.sqlType, `${PARAM_PREFIX}${attr.value}`, sqlLocation, attr.readOnly);
        //                 outputs.push(codeEndpoint);
        //         }

        //         endpoint.inputs = [...inputs];
        //         endpoint.outputs = [...outputs];

        //         return endpoint;
        // }

        hasPrimaryKey(): boolean {
                return Object.keys(this.primaryKeys()).length > 0;
        }
        hasForeignKey(): boolean {
                return Object.keys(this.foreignKeys()).length > 0;
        }
}
