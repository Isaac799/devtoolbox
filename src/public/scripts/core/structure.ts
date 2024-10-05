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

export const SQL_TO_GO_PACKAGE = {
        [SqlType.BIT]: 'strconv',
        [SqlType.DATE]: 'strconv',
        [SqlType.CHAR]: 'strconv',
        [SqlType.TIME]: 'time',
        [SqlType.TIMESTAMP]: 'time',
        [SqlType.SERIAL]: 'strconv',
        [SqlType.DECIMAL]: 'strconv',
        [SqlType.FLOAT]: 'strconv',
        [SqlType.REAL]: 'strconv',
        [SqlType.INT]: 'strconv',
        [SqlType.BOOLEAN]: 'strconv',
        [SqlType.xs]: 'strconv',
        [SqlType.s]: 'strconv',
        [SqlType.m]: 'strconv',
        [SqlType.l]: 'strconv',
        [SqlType.xl]: 'strconv',
        [SqlType.xxl]: 'strconv',
};

export const SQL_TO_GO_PACKAGE_FOR_STRUCT = {
        [SqlType.BIT]: '',
        [SqlType.DATE]: '',
        [SqlType.CHAR]: '',
        [SqlType.TIME]: 'time',
        [SqlType.TIMESTAMP]: 'time',
        [SqlType.SERIAL]: '',
        [SqlType.DECIMAL]: '',
        [SqlType.FLOAT]: '',
        [SqlType.REAL]: '',
        [SqlType.INT]: '',
        [SqlType.BOOLEAN]: '',
        [SqlType.xs]: '',
        [SqlType.s]: '',
        [SqlType.m]: '',
        [SqlType.l]: '',
        [SqlType.xl]: '',
        [SqlType.xxl]: '',
};
export const SQL_TO_HTML_INPUT_TYPE = {
        [SqlType.BIT]: '', // NOT NEEDED
        [SqlType.DATE]: 'date',
        [SqlType.CHAR]: 'text',
        [SqlType.TIME]: 'time',
        [SqlType.TIMESTAMP]: 'datetime-local',
        [SqlType.SERIAL]: 'number',
        [SqlType.DECIMAL]: 'number',
        [SqlType.FLOAT]: 'number',
        [SqlType.REAL]: 'number',
        [SqlType.INT]: 'number',
        [SqlType.BOOLEAN]: '', // NOT NEEDED
        [SqlType.xs]: 'text',
        [SqlType.s]: 'text',
        [SqlType.m]: 'text',
        [SqlType.l]: 'text',
        [SqlType.xl]: 'text',
        [SqlType.xxl]: 'text',
};

export const SQL_TO_HTML_INPUT_CLASS = {
        [SqlType.BIT]: '', // NOT NEEDED
        [SqlType.DATE]: 'input',
        [SqlType.CHAR]: 'input',
        [SqlType.TIME]: 'input',
        [SqlType.TIMESTAMP]: 'input',
        [SqlType.SERIAL]: 'input',
        [SqlType.DECIMAL]: 'input',
        [SqlType.FLOAT]: 'input',
        [SqlType.REAL]: 'input',
        [SqlType.INT]: 'input',
        [SqlType.BOOLEAN]: '', // NOT NEEDED
        [SqlType.xs]: 'input',
        [SqlType.s]: 'input',
        [SqlType.m]: 'input',
        [SqlType.l]: 'input',
        [SqlType.xl]: 'input',
        [SqlType.xxl]: 'input',
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

type goHtmlInputFunction = (x: SqlTableAttribute) => string;
type goHtmlInputFunctionWithValue = (x: SqlTableAttribute, setValueToThisAttribute: string) => string;

const boolRadioHtmlInputFunctionForGo: goHtmlInputFunction = (x) => `<fieldset class="control">
            <legend>${SnakeToPascal(x.value)}:</legend>
            <label class="radio">
                <input
                    type="radio" 
                    value="true"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}
                >
                True
            </label>
            <label class="radio">
                <input 
                    type="radio" 
                    value="false"
                    name="${x.value}"
                >
                False
            </label>
        </fieldset>`;

const boolRadioHtmlInputFunctionForGoWithValue: goHtmlInputFunctionWithValue = (x, y) => `<fieldset class="control">
            <legend>${SnakeToPascal(x.value)}:</legend>
            <label class="radio">
                <input
                    type="radio" 
                    value="true"
                    name="${x.value}"${x.isNullable() ? '' : '\n                    required'}
                    {{if .Data.${y}}}checked{{end}}
                >
                True
            </label>
            <label class="radio">
                <input 
                    type="radio" 
                    value="false"
                    name="${x.value}"
                    {{if not .Data.${y}}}checked{{end}}
                >
                False
            </label>
        </fieldset>`;

function genericHtmlInputFunctionForGo(sqlT: SqlType): goHtmlInputFunction {
        return function ah(x) {
                return `<div class="field">
                    <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
                    <div class="control">
                        <input
                            class="${SQL_TO_HTML_INPUT_CLASS[sqlT]}"
                            type="${SQL_TO_HTML_INPUT_TYPE[sqlT]}"
                            id="${x.value}"
                            name="${x.value}"${x.isNullable() ? '' : '\n                    required'}
                        />
                    </div>
                </div>`;
        };
}
function genericHtmlInputFunctionForGoWithValue(sqlT: SqlType): goHtmlInputFunctionWithValue {
        return function ah(x, y) {
                return `<div class="field">
                    <label class="label" for="${x.value}">${SnakeToPascal(x.value)}</label>
                    <div class="control">
                        <input
                            class="${SQL_TO_HTML_INPUT_CLASS[sqlT]}"
                            type="${SQL_TO_HTML_INPUT_TYPE[sqlT]}"
                            id="${x.value}"
                            name="${x.value}"${x.isNullable() ? '' : '\n                    required'}${
                        y ? `\n                    value="{{ .Data.${y} }}"` : ''
                }
                        />
                    </div>
                </div>`;
        };
}

export type RangeResult = {
        min: number;
        max: number;
};

export type GoAttrStuff = {
        goType: string;
        parseFunction: (x: string) => string;
        toStringFunction: (x: string) => string;
        htmlInputFunction: goHtmlInputFunction;
        htmlInputWithValueFunction: goHtmlInputFunctionWithValue;
        importPackageForConversion: string;
        importPackageForStruct: string;
};

export const SQL_TO_GO_TYPE: Record<string, GoAttrStuff> = {
        [SqlType.BIT]: {
                goType: 'bool',
                parseFunction: (x) => `strconv.ParseBool(${x})`,
                toStringFunction: (x) => `strconv.FormatBool(${x})`,
                htmlInputFunction: boolRadioHtmlInputFunctionForGo,
                htmlInputWithValueFunction: boolRadioHtmlInputFunctionForGoWithValue,
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.BIT],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.BIT],
        },
        [SqlType.DATE]: {
                // TODO
                //t := time.Now()
                // str := t.Format("2006-01-02 15:04:05") // Example format
                goType: 'time.Time',
                parseFunction: (x) => `time.Parse("2006-01-02", ${x})`,
                toStringFunction: (x) => `TODO ${x}`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.DATE),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.DATE),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.DATE],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.DATE],
        },
        [SqlType.CHAR]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                toStringFunction: (x) => `${x}`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.CHAR),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.CHAR),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.CHAR],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.CHAR],
        },
        [SqlType.TIME]: {
                // TODO
                //t := time.Now()
                // str := t.Format("2006-01-02 15:04:05") // Example format

                goType: 'time.Time',
                parseFunction: (x) => `time.Parse("15:04:05", ${x})`,
                toStringFunction: (x) => `TODO ${x}`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.TIME),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.TIME),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.TIME],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.TIME],
        },
        [SqlType.TIMESTAMP]: {
                // TODO
                //t := time.Now()
                // str := t.Format("2006-01-02 15:04:05") // Example format

                goType: 'time.Time',
                parseFunction: (x) => `time.Parse("2006-01-02 15:04:05", ${x})`,
                toStringFunction: (x) => `TODO ${x}`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.TIMESTAMP),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.TIMESTAMP),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.TIMESTAMP],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.TIMESTAMP],
        },
        [SqlType.SERIAL]: {
                goType: 'int',
                parseFunction: (x) => `strconv.Atoi(${x})`,
                toStringFunction: (x) => `strconv.Itoa(${x})`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.SERIAL),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.SERIAL),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.SERIAL],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.SERIAL],
        },
        [SqlType.DECIMAL]: {
                goType: 'float64',
                parseFunction: (x) => `strconv.ParseFloat(${x}, 64)`,
                toStringFunction: (x) => `strconv.FormatFloat(${x}, 'f', -1, 64)`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.DECIMAL),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.DECIMAL),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.DECIMAL],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.DECIMAL],
        },
        [SqlType.FLOAT]: {
                goType: 'float64',
                parseFunction: (x) => `strconv.ParseFloat(${x}, 64)`,
                toStringFunction: (x) => `strconv.FormatFloat(${x}, 'f', -1, 64)`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.FLOAT),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.FLOAT),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.FLOAT],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.FLOAT],
        },
        [SqlType.REAL]: {
                goType: 'float64',
                parseFunction: (x) => `strconv.ParseFloat(${x}, 64)`,
                toStringFunction: (x) => `strconv.FormatFloat(${x}, 'f', -1, 64)`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.REAL),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.REAL),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.REAL],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.REAL],
        },
        [SqlType.INT]: {
                goType: 'int',
                parseFunction: (x) => `strconv.Atoi(${x})`,
                toStringFunction: (x) => `strconv.Itoa(${x})`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.INT),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.INT),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.INT],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.INT],
        },
        [SqlType.BOOLEAN]: {
                goType: 'bool',
                parseFunction: (x) => `strconv.ParseBool(${x})`,
                toStringFunction: (x) => `strconv.FormatBool(${x})`,
                htmlInputFunction: boolRadioHtmlInputFunctionForGo,
                htmlInputWithValueFunction: boolRadioHtmlInputFunctionForGoWithValue,
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.BOOLEAN],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.BOOLEAN],
        },
        [SqlType.xs]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                toStringFunction: (x) => `${x}`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.s),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.s),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.xs],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.xs],
        },
        [SqlType.s]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                toStringFunction: (x) => `${x}`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.s),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.s),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.s],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.s],
        },
        [SqlType.m]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                toStringFunction: (x) => `${x}`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.s),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.s),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.m],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.m],
        },
        [SqlType.l]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                toStringFunction: (x) => `${x}`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.s),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.s),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.l],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.l],
        },
        [SqlType.xl]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                toStringFunction: (x) => `${x}`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.s),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.s),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.xl],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.xl],
        },
        [SqlType.xxl]: {
                goType: 'string',
                parseFunction: (x) => `${x}`,
                toStringFunction: (x) => `${x}`,
                htmlInputFunction: genericHtmlInputFunctionForGo(SqlType.s),
                htmlInputWithValueFunction: genericHtmlInputFunctionForGoWithValue(SqlType.s),
                importPackageForConversion: SQL_TO_GO_PACKAGE[SqlType.xxl],
                importPackageForStruct: SQL_TO_GO_PACKAGE_FOR_STRUCT[SqlType.xxl],
        },
};

export class EndpointParam {
        typescript: {
                name: string;
                type: string;
        };
        go: {
                var: GoVar;
                stuff: GoAttrStuff;
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

        constructor(attr: SqlTableAttribute, inOut: boolean = false) {
                this.readOnly = attr.readOnly;

                let name = attr.value;
                if (inOut) {
                        name = IN_OUT_PREFIX + name;
                }

                this.typescript = {
                        name: SnakeToCamel(name),
                        type: SQL_TO_TS_TYPE[attr.sqlType],
                };
                this.go = {
                        stuff: SQL_TO_GO_TYPE[attr.sqlType],
                        var: {
                                propertyAsVariable: SnakeToCamel(name),
                                propertyName: SnakeToPascal(attr.value),
                                propertyGoType: SQL_TO_GO_TYPE[attr.sqlType].goType,
                        },
                };
                this.json = {
                        name: name,
                        type: attr.sqlType,
                };
                this.sql = {
                        name: name,
                        type: attr.sqlType,
                        sqlLocation: new SqlLocation(attr.parentTable.parentSchema.name, attr.parentTable.label, attr.value),
                };
                this.html = {
                        name: SnakeToTitle(name),
                        type: SQL_TO_HTML_INPUT_TYPE[attr.sqlType],
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

export type GoVar = {
        propertyAsVariable: string;
        propertyName: string;
        propertyGoType: string;
};

export class Endpoint {
        method: HttpMethod;
        /**
         * if something can be used as select options, ad a drop down list so to speak
         */
        isOptions: boolean = false;

        repo: {
                type: string;
                var: string;
        };
        sql: {
                inout: EndpointParam[];
                inputs: EndpointParam[];
                outputs: EndpointParam[];
                name: string;
        };
        http: {
                query: EndpointParam;
                path: EndpointParam[];
                bodyIn: EndpointParam[];
                bodyOut: EndpointParam[];
                name: string;
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
                routerFuncName: string;
                routerFuncApiName: string;
                routerFuncFormName: string;
                routerRepoName: string;
                primaryKey: EndpointParam;
                real: {
                        name: string;
                        type: string;
                };
        };
        url: {
                indexPage: string;
                forRouter: string;
                filePath: string;
                apiIndexPage: string;
        };

        private tableLabel: string;
        tableFullName: string;

        filePath = (kind: 'show' | 'new' | 'edit' | 'index') => {
                let endpointPath = `/web/templates/${this.tableLabel}/${kind}.html`;
                // let endpointPath = `/templates/${this.sqlSchemaName}/${this.sqlTableName}/${kind}.html`;
                return endpointPath;
        };

        constructor(method: HttpMethod, table: SqlTable, many: boolean, pk: SqlTableAttribute) {
                this.method = method;
                this.tableFullName = table.fullName;
                let manyStrModifier = many ? 's' : '';
                this.tableLabel = table.label;

                // this.routerFuncApiName = SnakeToPascal(`api_${HttpMethodToHtmlName(this.method, many)}_${table.label}`);

                this.repo = {
                        type: `${SnakeToPascal(table.label + '_repository')}`,
                        var: `${SnakeToCamel(table.label + '_repository')}`,
                };

                this.sql = {
                        inout: [],
                        inputs: [],
                        outputs: [],
                        name: `${method.toLowerCase()}_${table.label}${manyStrModifier}`,
                };
                this.http = {
                        query: new EndpointParam(pk),
                        path: [],
                        bodyIn: [],
                        bodyOut: [],
                        name: SnakeToKebab(`${method.toLowerCase()}_${table.label}${manyStrModifier}`),
                };
                this.typescript = {
                        fnName: SnakeToCamel(this.sql.name),
                        input: {
                                name: SnakeToCamel(`${this.sql.name}`),
                                type: SnakeToCamel(`${this.sql.name}`),
                        },
                        output: {
                                name: SnakeToCamel(`${this.sql.name}`),
                                type: SnakeToCamel(`${this.sql.name}`),
                        },
                        real: {
                                name: SnakeToCamel(table.label),
                                type: SnakeToCamel(table.label),
                        },
                };

                this.go = {
                        fnName: SnakeToPascal(this.sql.name),
                        routerFuncName: SnakeToPascal(`${HttpMethodToHtmlName(this.method, many)}_${table.label}`),
                        routerFuncApiName: SnakeToPascal(`${this.method.toLocaleLowerCase()}_${table.label}${manyStrModifier}`),
                        routerFuncFormName: SnakeToPascal(`${this.method.toLocaleLowerCase()}_${table.label}_form${manyStrModifier}`),
                        routerRepoName: SnakeToPascal(`${this.method.toLocaleLowerCase()}_${table.label}${manyStrModifier}`),

                        primaryKey: new EndpointParam(pk),
                        real: {
                                name: SnakeToKebab(table.label),
                                type: SnakeToPascal(table.label),
                        },
                };

                let endpointPath = `/${this.go.real.name}`;

                if (!many && this.method !== HttpMethod.POST) {
                        endpointPath += `/{${this.http.query.go.var.propertyAsVariable}}`;
                }

                this.url = {
                        forRouter: endpointPath,
                        indexPage: `/${this.go.real.name}`,
                        apiIndexPage: `/api/${this.go.real.name}`,
                        filePath: `/web/templates/${this.go.real.name}`,
                };
        }

        sqlOutputs() {
                return this.sql.outputs.map((e) => e.sql.name).join(',\n    ');
        }
}

export class EntityEndpoints {
        create: {
                single: Endpoint;
        };
        read: {
                single: Endpoint;
                many: Endpoint;
        };
        update: {
                single: Endpoint;
        };
        delete: {
                single: Endpoint;
        };

        constructor(
                createIn: {
                        single: Endpoint;
                },
                readIn: {
                        single: Endpoint;
                        many: Endpoint;
                },
                updateIn: {
                        single: Endpoint;
                },
                deleteIn: {
                        single: Endpoint;
                }
        ) {
                this.create = createIn;
                this.read = readIn;
                this.update = updateIn;
                this.delete = deleteIn;
        }
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

export type AttrValidation = {
        range?: RangeResult;
};

export class SqlTableAttribute {
        id: number;
        referenceToSelf: boolean = false;
        sqlType: SqlType;
        defaultValue?: string | null = null;
        referenceTo: SqlReferenceTo | null = null;

        parentTable: SqlTable;
        value: string;
        readOnly: boolean;
        shortHandType: string;
        options: Set<string>;
        validation: AttrValidation;

        constructor(
                parent: SqlTable,
                type: SqlType,
                value: string,
                readOnly: boolean,
                shortHandType: string,
                options: Set<string>,
                validation: AttrValidation
        ) {
                this.id = Math.random();
                this.parentTable = parent;
                this.sqlType = type;
                this.value = value;
                this.readOnly = readOnly;
                this.shortHandType = shortHandType;
                this.options = options;
                this.validation = validation;
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

export type PreSqlTable = {
        parentSchema: SqlSchema;
        label: string;
        options: string[];
};

export class SqlTable {
        id: number;
        label: string;
        goPackageName: string;
        parentSchema: SqlSchema;
        options: string[] = [];
        attributes: {
                [x: string]: SqlTableAttribute;
        } = {};

        get singlePk(): SqlTableAttribute | null {
                let pks = this.primaryKeys();
                let values = Object.values(pks);
                if (values.length !== 1) return null;
                return values[0];
        }

        is: EndpointParam[] = [];
        endpoints: EntityEndpoints | null = null;

        get fullName(): string {
                return `${this.parentSchema.name}.${this.label}`;
        }

        constructor(parent: SqlSchema, label: string) {
                this.parentSchema = parent;
                this.label = label;
                this.id = Math.random();
                this.goPackageName = label.toLowerCase();
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

        generateEndpoints() {
                let primaryInOutAttrs = Object.values(this.primaryKeys()).map((e) => {
                        return new EndpointParam(e, true);
                });
                let primaryAttrs = Object.values(this.primaryKeys()).map((e) => {
                        return new EndpointParam(e);
                });
                let allAttrs = Object.values(this.attributes).map((e) => {
                        return new EndpointParam(e);
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
                                return new EndpointParam(e);
                        });

                if (!this.singlePk) {
                        console.log('no single pk, skipping endpoint gen for ' + this.label);
                        return;
                }

                let createSingle = new Endpoint(HttpMethod.POST, this, false, this.singlePk);
                createSingle.sql.inout = [...primaryInOutAttrs];
                createSingle.sql.inputs = [...nonPrimaryAttrs];
                createSingle.http.bodyIn = [...nonPrimaryAttrs];
                createSingle.sql.outputs = [...primaryInOutAttrs];
                createSingle.http.bodyOut = [...allAttrs];

                let readSingle = new Endpoint(HttpMethod.GET, this, false, this.singlePk);
                readSingle.sql.inputs = [...primaryAttrs];
                readSingle.http.path = [...primaryAttrs];
                readSingle.sql.outputs = [...allAttrs];
                readSingle.http.bodyOut = [...allAttrs];

                // if (simpleAttrs.length > 0) {
                //         let readOptions = new Endpoint(HttpMethod.GET, `options_${this.label}`, this, true, this.singlePk);
                //         readOptions.sql.inputs = [];
                //         readOptions.http.path = [];
                //         readOptions.sql.outputs = [...primaryAttrs, ...simpleAttrs];
                //         readOptions.http.bodyOut = [...primaryAttrs, ...simpleAttrs];
                //         this.entityEndpoints.read.push(readOptions);
                // }

                let readEverything = new Endpoint(HttpMethod.GET, this, true, this.singlePk);
                readEverything.sql.inputs = [];
                readEverything.http.path = [];
                readEverything.sql.outputs = [...allAttrs];
                readEverything.http.bodyOut = [...allAttrs];

                let updateSingle = new Endpoint(HttpMethod.PUT, this, false, this.singlePk);
                updateSingle.sql.inout = [...primaryInOutAttrs];
                updateSingle.sql.inputs = [...nonPrimaryAttrs];
                updateSingle.http.bodyIn = [...nonPrimaryAttrs];
                updateSingle.http.path = [...primaryAttrs];

                updateSingle.sql.outputs = [];
                updateSingle.http.bodyOut = [];

                let deleteSingle = new Endpoint(HttpMethod.DELETE, this, false, this.singlePk);
                deleteSingle.sql.inputs = [...primaryAttrs];
                deleteSingle.http.path = [...primaryAttrs];

                this.endpoints = new EntityEndpoints(
                        {
                                single: createSingle,
                        },
                        {
                                single: readSingle,
                                many: readEverything,
                        },
                        {
                                single: updateSingle,
                        },
                        {
                                single: deleteSingle,
                        }
                );
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

        hasPrimaryKey(): boolean {
                return Object.keys(this.primaryKeys()).length > 0;
        }
        hasForeignKey(): boolean {
                return Object.keys(this.foreignKeys()).length > 0;
        }
}
