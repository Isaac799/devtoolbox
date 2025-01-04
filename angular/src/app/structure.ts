import { cc, fixPluralGrammar } from './formatting';

export enum Rel {
  SameTable = 1 << 1,
  SameSchema = 1 << 2,
  DiffSchema = 1 << 3,
}

export enum Lang {
  PGSQL = 1 << 4,
  TSQL = 1 << 5,
  GO = 1 << 6,
  TS = 1 << 7,
}

export enum Cardinality {
  One = 1 << 8,
  Many = 1 << 9,
  Self = 1 << 10,
}

export class FuncIn {
  label: string;
  type: string;

  constructor(l: string, t: string) {
    this.label = l;
    this.type = t;
  }
}

export class FuncOut {
  relatedInput: FuncIn | null;
  defaultValue: string;
  label: string;
  type: string;

  constructor(
    l: string,
    t: string,
    relatedInput: FuncIn | null,
    newValueFallback: string
  ) {
    this.label = l;
    this.type = t;
    this.relatedInput = relatedInput;
    this.defaultValue = newValueFallback;
  }
}

export class Func {
  lang: Lang;
  table: Table;
  mode: AppGeneratorMode;
  inputs: FuncIn[];
  outputs: FuncOut[];
  title: string;

  constructor(t: Table, mode: AppGeneratorMode) {
    this.mode = mode;
    this.table = t;

    this.lang = Func.determineLanguage(mode);
    this.title = this.determineTitle();

    this.inputs = this.genFnInputs();
    this.outputs = this.genFnOutputs(this.inputs);
  }

  genFnInputs(): FuncIn[] {
    let inputs: FuncIn[] = [];

    for (const a of this.table.Attributes) {
      if (a.Option?.SystemField || a.Option?.Default) {
        continue;
      }
      if (a.RefTo) {
        for (const ra of a.RefTo.Attributes) {
          if (!ra.Option?.PrimaryKey) continue;
          let sameSchema = ra.Parent.Parent.ID === this.table.Parent.ID;
          let relation = sameSchema ? Rel.SameSchema : Rel.DiffSchema;
          let { label, type } = genLabelType(
            'in',
            a,
            ra,
            this.lang,
            relation,
            Cardinality.One
          );
          inputs.push(new FuncIn(label, type));
        }

        continue;
      }
      let { label, type } = genLabelType(
        'in',
        a,
        a,
        this.lang,
        Rel.SameTable,
        Cardinality.Self
      );
      inputs.push(new FuncIn(label, type));
    }

    return inputs;
  }

  genFnOutputs(inputs: FuncIn[]): FuncOut[] {
    let outputs: FuncOut[] = [];

    let inputIndex = 0;
    for (const a of this.table.Attributes) {
      let goFnStructAttributes: FuncOut[];

      if (a.Option?.SystemField || a.Option?.Default) {
        goFnStructAttributes = this.genFnOutput(a, null, null);
      } else {
        goFnStructAttributes = this.genFnOutput(
          a,
          null,
          inputs[inputIndex] || null
        );
        inputIndex += 1;
      }

      outputs = outputs.concat(goFnStructAttributes);
    }

    /**
     *
     * For the TS, and GO we do look at what refed by
     * otherwise we only take it at face value
     *
     */
    // if (this.table.RefBy && ![Lang.TSQL, Lang.PGSQL].includes(this.lang)) {
    if (this.table.RefBy) {
      for (const tbl of this.table.RefBy) {
        let added = false;
        for (const a of tbl.Attributes) {
          if (!a.RefTo) continue;
          if (a.RefTo.ID === this.table.ID) continue;
          added = true;

          let sameSchema = a.Parent.Parent.ID === this.table.Parent.ID;
          let sameTable = a.Parent.ID === this.table.ID;
          let relation = sameSchema
            ? Rel.SameSchema
            : sameTable
            ? Rel.SameTable
            : Rel.DiffSchema;

          let lPrefix = tbl.FN;
          if (relation === Rel.SameSchema || relation === Rel.SameTable) {
            lPrefix = tbl.Name;
          }
          let l = cc(lPrefix + '_' + a.RefTo.Name, 'sk');

          let fakeA = new Attribute(-1, l, AttrType.REFERENCE, this.table);
          fakeA.Validation = {
            Required: true,
          };

          let { label, type, defaultValue } = genLabelType(
            'out',
            fakeA,
            fakeA,
            this.lang,
            relation,
            Cardinality.Many,
            a.RefTo.Name
          );
          outputs.push(new FuncOut(label, type, null, defaultValue));
          // inputs.push(
          //   new FuncIn(
          //     fixPluralGrammar(cc(`${a.RefTo.FN}s`, 'pl')),
          //     `[]${cc(a.RefTo.FN, 'pl')}{}`
          //   )
          // );
        }
        if (!added) {
          let sameSchema = tbl.Parent.ID === this.table.Parent.ID;
          let sameTable = tbl.ID === this.table.ID;
          let relation = sameSchema
            ? Rel.SameSchema
            : sameTable
            ? Rel.SameTable
            : Rel.DiffSchema;

          let l = tbl.FN;
          if (relation === Rel.SameSchema || relation === Rel.SameTable) {
            l = tbl.Name;
          }

          let fakeA = new Attribute(-1, l, AttrType.REFERENCE, this.table);
          fakeA.Validation = {
            Required: true,
          };

          let { label, type, defaultValue } = genLabelType(
            'out',
            fakeA,
            fakeA,
            this.lang,
            relation,
            Cardinality.One,
            tbl.Name
          );
          outputs.push(new FuncOut(label, type, null, defaultValue));

          // inputs.push(new FuncIn(cc(tbl.FN, 'pl'), `nil`));
        }
      }
    }

    return outputs;
  }

  genFnOutput(
    a: Attribute,
    recursive: Attribute | null,
    relatedInput: FuncIn | null
  ): FuncOut[] {
    let answer: FuncOut[] = [];

    if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
      a.RefTo.Attributes;
      for (const ra of a.RefTo.Attributes) {
        if (!ra.Option?.PrimaryKey) {
          continue;
        }
        let refAttrs = this.genFnOutput(ra, a, relatedInput);
        answer = answer.concat(refAttrs);
      }
      return answer;
    }

    if (recursive) {
      let sameSchema = a.Parent.Parent.ID === this.table.Parent.ID;
      let sameTable = a.Parent.ID === this.table.ID;
      let relation = sameSchema
        ? Rel.SameSchema
        : sameTable
        ? Rel.SameTable
        : Rel.DiffSchema;

      let { label, type, defaultValue } = genLabelType(
        'out',
        a,
        recursive,
        this.lang,
        relation,
        Cardinality.Self
      );
      answer.push(new FuncOut(label, type, relatedInput, defaultValue));
    } else {
      let { label, type, defaultValue } = genLabelType(
        'out',
        a,
        a,
        this.lang,
        Rel.SameTable,
        Cardinality.Self
      );
      answer.push(new FuncOut(label, type, relatedInput, defaultValue));
    }
    return answer;
  }

  private determineTitle(): string {
    let map: Record<Lang, string> = {
      [Lang.PGSQL]: cc(this.table.Name, 'sk'),
      [Lang.TSQL]: cc(this.table.Name, 'sk'),
      [Lang.GO]: cc(this.table.Name, 'pl'),
      [Lang.TS]: cc(this.table.Name, 'pl'),
    };
    return map[this.lang];
  }
  private static determineLanguage(mode: AppGeneratorMode): Lang {
    let isGo = [AppGeneratorMode.Go].includes(mode);
    if (isGo) {
      return Lang.GO;
    }
    let isTs = [
      AppGeneratorMode.AngularFormControl,
      AppGeneratorMode.TS,
    ].includes(mode);
    if (isTs) {
      return Lang.TS;
    }
    let isTSQL = [
      AppGeneratorMode.TSQLTables,
      AppGeneratorMode.TSQLStoredProcedures,
    ].includes(mode);
    if (isTSQL) {
      return Lang.TSQL;
    }
    let isPostgres = [
      AppGeneratorMode.PostgresFunctions,
      AppGeneratorMode.Postgres,
    ].includes(mode);
    if (isPostgres) {
      return Lang.PGSQL;
    }

    console.error(
      'unaccounted mode! defaulted to postgres when determining language'
    );
    return Lang.PGSQL;
  }
}

// Validation holds validation rules for an attribute
export type Validation = {
  Required?: boolean;
  Min?: number;
  Max?: number;
};

// Options holds additional options for attributes and tables
export type AttributeOptions = {
  PrimaryKey?: boolean;
  Unique?: boolean;
  Default?: string;
  SystemField?: boolean;
};

// Attribute represents an individual attribute of a table
export type AttributeConfig = {
  ID: number;
  ParentID: number;
  RefToID?: number;
  Type: AttrType;
  Option?: AttributeOptions;
  Validation?: Validation;
};
// Attribute represents an individual attribute of a table
export class AttributeSuggestion {
  Name: string;
  Type: AttrType;
  Option?: AttributeOptions;
  Validation?: Validation;

  constructor(Name: string, Type: AttrType) {
    this.Name = Name;
    this.Type = Type;
  }
}
// Attribute represents an individual attribute of a table
export class Attribute {
  ID: number;
  Parent: Table;
  RefTo?: Table;
  Name: string;
  Type: AttrType;
  Option?: AttributeOptions;
  Validation?: Validation;

  constructor(ID: number, Name: string, Type: AttrType, Parent: Table) {
    this.ID = ID;
    this.Name = Name;
    this.Type = Type;
    this.Parent = Parent;
  }

  get PFN(): string {
    return [cc(this.Parent.Name, 'sk'), cc(this.Name, 'sk')].join('.');
  }

  get FN(): string {
    return [
      cc(this.Parent.Parent.Name, 'sk'),
      cc(this.Parent.Name, 'sk'),
      cc(this.Name, 'sk'),
    ].join('.');
  }
}

// Schema represents the entire schema containing multiple tables
export type SchemaConfig = {
  ID: number;
  Tables: Record<string, TableConfig>;
};
// Schema represents the entire schema containing multiple tables
export class Schema {
  ID: number;
  Name: string;
  Tables: Table[];

  constructor(ID: number, Name: string) {
    this.ID = ID;
    this.Name = Name;

    this.Tables = [];
  }
}

// // Options holds additional options for attributes and tables
// export type TableOptions = {
//   AutoPrimaryKey: boolean;
//   AutoTimestamps: boolean;
// };

// Table represents a database table with its attributes and options
export type TableConfig = {
  ID: number;
  ParentID: number;
  // Options: TableOptions;
  Attributes: Record<string, AttributeConfig>;
};

// Table represents a database table with its attributes and options
export class Table {
  ID: number;
  Parent: Schema;
  RefBy?: Table[];
  Name: string;
  // Options: TableOptions;
  Attributes: Attribute[];

  constructor(ID: number, Name: string, Parent: Schema) {
    this.ID = ID;
    this.Name = Name;
    this.Parent = Parent;

    this.Attributes = [];
  }

  get FN(): string {
    return [cc(this.Parent.Name, 'sk'), cc(this.Name, 'sk')].join('.');
  }
}

export enum AppMode {
  JSON,
  YAML,
}

export enum AppGeneratorMode {
  PostgresFunctions,
  Postgres,
  AngularFormControl,
  Go,
  TS,
  TSQLTables,
  TSQLStoredProcedures,
}

export enum AppComplexityMode {
  Simple,
  Advanced,
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
  REFERENCE = 'REF',
}

export type App = {
  mode: AppMode;
  generatorMode: AppGeneratorMode;
  complexity: AppComplexityMode;
};

export enum NotificationKind {
  Primary = 'primary',
  Accent = 'accent',
  Warn = 'warn',
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Highlight = 'highlight',
}

export enum NotificationLife {
  Short = 2000,
  Standard = 3500,
}

export class Notification {
  id: number;
  kind: NotificationKind;
  title: string;
  message: string;
  life: NotificationLife;

  constructor(
    title: string,
    message: string,
    kind: NotificationKind = NotificationKind.Primary,
    life: NotificationLife = NotificationLife.Standard
  ) {
    this.id = Date.now();
    this.kind = kind;
    this.title = title;
    this.message = message;
    this.life = life;
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
  [AttrType.REFERENCE]: '',
};

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
  [AttrType.REFERENCE]: '',
};

export const SQL_TO_GO_DEFAULT_VALUE: Record<AttrType, string> = {
  [AttrType.BIT]: 'false',
  [AttrType.DATE]: 'time.Time{}',
  [AttrType.CHAR]: "''",
  [AttrType.TIME]: 'time.Time{}',
  [AttrType.TIMESTAMP]: 'time.Time{}',
  [AttrType.SERIAL]: '0',
  [AttrType.DECIMAL]: '0',
  [AttrType.FLOAT]: '0',
  [AttrType.REAL]: '0',
  [AttrType.INT]: '0',
  [AttrType.BOOLEAN]: 'false',
  [AttrType.VARCHAR]: "''",
  [AttrType.MONEY]: '0',
  [AttrType.REFERENCE]: '',
};

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
  [AttrType.REFERENCE]: '',
};

export const SQL_TO_TS_DEFAULT_VALUE: Record<AttrType, string> = {
  [AttrType.BIT]: 'false',
  [AttrType.DATE]: 'new Date()',
  [AttrType.CHAR]: "''",
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
  [AttrType.REFERENCE]: '',
};

function genLabelType(
  io: 'in' | 'out',
  aL: Attribute,
  aT: Attribute,
  lang: Lang,
  relation: Rel,
  cardinality: Cardinality,
  overrideType: string = ''
): { label: string; type: string; defaultValue: string } {
  let map = new Map<
    number,
    { label: string; type: string; defaultValue: string }
  >();
  const isNullable =
    aL.Validation?.Required ||
    (aL.Option?.PrimaryKey && aL.Type !== AttrType.REFERENCE);

  //#region PostgreSQL

  const psqlCase = io === 'in' ? 'sk' : 'sk';
  let psqlType: string = aT.Type;

  if (!psqlType) {
    psqlType = SQL_TO_TSQL_TYPE[aL.Type];
  }

  if (psqlType === AttrType.SERIAL) {
    psqlType = 'INT';
  }

  map.set(Lang.PGSQL | Rel.SameTable | Cardinality.Self, {
    label: cc(aL.Name, psqlCase),
    type: psqlType,
    defaultValue: '',
  });
  map.set(Lang.PGSQL | Rel.SameSchema | Cardinality.Self, {
    label: cc(aL.PFN, psqlCase),
    type: psqlType,
    defaultValue: '',
  });
  map.set(Lang.PGSQL | Rel.DiffSchema | Cardinality.Self, {
    label: cc(aL.FN, psqlCase),
    type: psqlType,
    defaultValue: '',
  });

  //    -    -

  map.set(Lang.PGSQL | Rel.SameTable | Cardinality.One, {
    label: cc(aL.Name, psqlCase),
    type: psqlType,
    defaultValue: '',
  });
  map.set(Lang.PGSQL | Rel.SameSchema | Cardinality.One, {
    label: cc(aL.PFN, psqlCase),
    type: psqlType,
    defaultValue: '',
  });
  map.set(Lang.PGSQL | Rel.DiffSchema | Cardinality.One, {
    label: cc(aL.FN, psqlCase),
    type: psqlType,
    defaultValue: '',
  });

  //    -    -

  map.set(Lang.PGSQL | Rel.SameTable | Cardinality.Many, {
    label: fixPluralGrammar(cc(aL.Name, psqlCase) + 's'),
    type: psqlType,
    defaultValue: '',
  });
  map.set(Lang.PGSQL | Rel.SameSchema | Cardinality.Many, {
    label: fixPluralGrammar(cc(aL.PFN, psqlCase) + 's'),
    type: psqlType,
    defaultValue: '',
  });
  map.set(Lang.PGSQL | Rel.DiffSchema | Cardinality.Many, {
    label: fixPluralGrammar(cc(aL.FN, psqlCase) + 's'),
    type: psqlType,
    defaultValue: '',
  });

  //#endregion

  //#region TSQL

  const tsqlCase = io === 'in' ? 'sk' : 'sk';
  let tsqlType: string = '';

  if (!tsqlType) {
    tsqlType = SQL_TO_TSQL_TYPE[aL.Type];
  }

  if (tsqlType === SQL_TO_TSQL_TYPE[AttrType.SERIAL]) {
    tsqlType = 'INT';
  }

  map.set(Lang.TSQL | Rel.SameTable | Cardinality.Self, {
    label: cc(aL.Name, tsqlCase),
    type: tsqlType,
    defaultValue: '',
  });
  map.set(Lang.TSQL | Rel.SameSchema | Cardinality.Self, {
    label: cc(aL.PFN, tsqlCase),
    type: tsqlType,
    defaultValue: '',
  });
  map.set(Lang.TSQL | Rel.DiffSchema | Cardinality.Self, {
    label: cc(aL.FN, tsqlCase),
    type: tsqlType,
    defaultValue: '',
  });

  //    -    -

  map.set(Lang.TSQL | Rel.SameTable | Cardinality.One, {
    label: cc(aL.Name, tsqlCase),
    type: tsqlType,
    defaultValue: '',
  });
  map.set(Lang.TSQL | Rel.SameSchema | Cardinality.One, {
    label: cc(aL.PFN, tsqlCase),
    type: tsqlType,
    defaultValue: '',
  });
  map.set(Lang.TSQL | Rel.DiffSchema | Cardinality.One, {
    label: cc(aL.FN, tsqlCase),
    type: tsqlType,
    defaultValue: '',
  });

  //    -    -

  map.set(Lang.TSQL | Rel.SameTable | Cardinality.Many, {
    label: fixPluralGrammar(cc(aL.Name, tsqlCase) + 's'),
    type: tsqlType,
    defaultValue: '',
  });
  map.set(Lang.TSQL | Rel.SameSchema | Cardinality.Many, {
    label: fixPluralGrammar(cc(aL.PFN, tsqlCase) + 's'),
    type: tsqlType,
    defaultValue: '',
  });
  map.set(Lang.TSQL | Rel.DiffSchema | Cardinality.Many, {
    label: fixPluralGrammar(cc(aL.FN, tsqlCase) + 's'),
    type: tsqlType,
    defaultValue: '',
  });

  //#endregion

  //#region Typescript

  const tsNullable = isNullable ? '' : ' | null';
  let tsType = overrideType ? cc(overrideType, 'pl') : SQL_TO_TS_TYPE[aT.Type];
  const tsCase = io === 'in' ? 'cm' : 'cm';
  const tsOverrideTypeRelatedLabel = fixPluralGrammar(
    cc(aT.Name, tsCase) + 's'
  );

  if (!tsType) {
    tsType = SQL_TO_TS_TYPE[aL.Type];
  }

  map.set(Lang.TS | Rel.SameTable | Cardinality.Self, {
    label: cc(aL.Name, tsCase),
    type: tsType + tsNullable,
    defaultValue: SQL_TO_TS_DEFAULT_VALUE[aT.Type],
  });
  map.set(Lang.TS | Rel.SameSchema | Cardinality.Self, {
    label: cc(aL.PFN, tsCase),
    type: tsType + tsNullable,
    defaultValue: SQL_TO_TS_DEFAULT_VALUE[aT.Type],
  });
  map.set(Lang.TS | Rel.DiffSchema | Cardinality.Self, {
    label: cc(aL.FN, tsCase),
    type: tsType + tsNullable,
    defaultValue: SQL_TO_TS_DEFAULT_VALUE[aT.Type],
  });

  //    -    -

  map.set(Lang.TS | Rel.SameTable | Cardinality.One, {
    label: cc(aL.Name, tsCase),
    type: tsType + ' | null',
    defaultValue: 'null',
  });
  map.set(Lang.TS | Rel.SameSchema | Cardinality.One, {
    label: cc(aL.PFN, tsCase),
    type: tsType + ' | null',
    defaultValue: 'null',
  });
  map.set(Lang.TS | Rel.DiffSchema | Cardinality.One, {
    label: cc(aL.FN, tsCase),
    type: tsType + ' | null',
    defaultValue: 'null',
  });

  //    -    -

  map.set(Lang.TS | Rel.SameTable | Cardinality.Many, {
    label: overrideType
      ? tsOverrideTypeRelatedLabel
      : fixPluralGrammar(cc(aL.Name, tsCase) + 's'),
    type: `${tsType}[]` + tsNullable,
    defaultValue: '[]',
  });
  map.set(Lang.TS | Rel.SameSchema | Cardinality.Many, {
    label: overrideType
      ? tsOverrideTypeRelatedLabel
      : fixPluralGrammar(cc(aL.PFN, tsCase) + 's'),
    type: `${tsType}[]` + tsNullable,
    defaultValue: '[]',
  });
  map.set(Lang.TS | Rel.DiffSchema | Cardinality.Many, {
    label: overrideType
      ? tsOverrideTypeRelatedLabel
      : fixPluralGrammar(cc(aL.FN, tsCase) + 's'),
    type: `${tsType}[]` + tsNullable,
    defaultValue: '[]',
  });

  //#endregion

  //#region Go Lang

  const goNullable = isNullable ? '' : '*';

  let goType = overrideType
    ? cc(overrideType, 'pl')
    : SQL_TO_GO_TYPE[aT.Type] || SQL_TO_GO_TYPE[aL.Type];
  const goCase = io === 'in' ? 'cm' : 'pl';
  const goOverrideTypeRelatedLabel = fixPluralGrammar(
    cc(aT.Name, goCase) + 's'
  );

  if (!goType) {
    goType = SQL_TO_GO_TYPE[aL.Type];
  }

  map.set(Lang.GO | Rel.SameTable | Cardinality.Self, {
    label: cc(aL.Name, goCase),
    type: goNullable + goType,
    defaultValue: SQL_TO_GO_DEFAULT_VALUE[aL.Type],
  });
  map.set(Lang.GO | Rel.SameSchema | Cardinality.Self, {
    label: cc(aL.PFN, goCase),
    type: goNullable + goType,
    defaultValue: SQL_TO_GO_DEFAULT_VALUE[aL.Type],
  });
  map.set(Lang.GO | Rel.DiffSchema | Cardinality.Self, {
    label: cc(aL.FN, goCase),
    type: goNullable + goType,
    defaultValue: SQL_TO_GO_DEFAULT_VALUE[aL.Type],
  });

  //    -    -

  map.set(Lang.GO | Rel.SameTable | Cardinality.One, {
    label: cc(aL.Name, goCase),
    type: io === 'in' ? '*' + goType : '*' + goType,
    defaultValue: 'nil',
  });
  map.set(Lang.GO | Rel.SameSchema | Cardinality.One, {
    label: cc(aL.PFN, goCase),
    type: io === 'in' ? '*' + goType : '*' + goType,
    defaultValue: 'nil',
  });
  map.set(Lang.GO | Rel.DiffSchema | Cardinality.One, {
    label: cc(aL.FN, goCase),
    type: io === 'in' ? '*' + goType : '*' + goType,
    defaultValue: 'nil',
  });

  //    -    -

  map.set(Lang.GO | Rel.SameTable | Cardinality.Many, {
    label: overrideType
      ? goOverrideTypeRelatedLabel
      : fixPluralGrammar(cc(aL.Name, goCase) + 's'),
    type: '[]' + goType,
    defaultValue: '[]' + goType + '{}',
  });
  map.set(Lang.GO | Rel.SameSchema | Cardinality.Many, {
    label: overrideType
      ? goOverrideTypeRelatedLabel
      : fixPluralGrammar(cc(aL.PFN, goCase) + 's'),
    type: '[]' + goType,
    defaultValue: '[]' + goType + '{}',
  });
  map.set(Lang.GO | Rel.DiffSchema | Cardinality.Many, {
    label: overrideType
      ? goOverrideTypeRelatedLabel
      : fixPluralGrammar(cc(aL.FN, goCase) + 's'),
    type: '[]' + goType,
    defaultValue: '[]' + goType + '{}',
  });

  //#endregion

  let answer = map.get(lang | relation | cardinality);

  if (!answer) {
    console.error(
      `unaccounted for language relation combo\n"${{ lang }}, ${{
        relation,
      }}, ${{ cardinality }}"\ndefaulted to diff schema postgres syntax`
    );
    return {
      label: cc(aL.FN, 'sk'),
      type: psqlType,
      defaultValue: '',
    };
  }

  let def = GenerateDefaultValue(aL, lang);
  if (def) {
    answer.defaultValue = def;
    return answer;
  }

  return answer;
}

export const GenerateDefaultValue = (
  a: Attribute,
  lang: Lang
): string | null => {
  let d = a.Option?.Default;

  if (!d) {
    return null;
  }

  let validFn = validationMap.get(a.Type);
  if (!validFn) {
    return null;
  }

  let valid = validFn(d);
  if (!valid) {
    return null;
  }

  if ([Lang.PGSQL, Lang.TSQL].includes(lang)) {
    switch (a.Type) {
      case AttrType.CHAR:
        return `'${d.replaceAll("'", "''")}'`;
      case AttrType.VARCHAR:
        return `'${d.replaceAll("'", "''")}'`;
      default:
        return `${d}`;
    }
  }

  if (lang === Lang.GO) {
    function getMonthString(month: string): string {
      const months: { [key: string]: string } = {
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
        '12': 'December',
      };

      const monthName = months[month];

      if (monthName) {
        return `time.${monthName}`;
      } else {
        return 'Invalid month';
      }
    }

    switch (a.Type) {
      case AttrType.BIT:
        return `${d}`;
      case AttrType.DATE:
        {
          let s = d.split('-');
          if (s.length === 3) {
            // Parameters: year, month, day, hour, minute, second, nanosecond
            return `time.Date(${s[0]}, ${getMonthString(s[1])}, ${
              s[2]
            }, 0, 0, 0, 0, time.UTC)`;
          } else if (d === 'CURRENT_DATE') {
            return `time.Now()`;
          } else if (d === 'NOW()') {
            return `time.Now()`;
          }
        }
        break;
      case AttrType.CHAR:
        if (d.length === 1) {
          return `"${d}"`;
        }
        break;
      case AttrType.TIME:
        {
          let s = d.split(':');
          if (s.length === 3) {
            // Parameters: year, month, day, hour, minute, second, nanosecond
            return `time.Date(1, 1, 1, ${s[0]}, ${s[1]}, ${s[2]}, 0, time.UTC)`;
          } else if (d === 'CURRENT_TIME') {
            return `time.Now()`;
          } else if (d === 'NOW()') {
            return `time.Now()`;
          }
        }
        return `${d}`;
      case AttrType.TIMESTAMP:
        {
          let s = d.split(' ');
          if (s.length === 2) {
            let date = s[0].split('-');
            let time = s[1].split(':');
            if (date.length === 3 && time.length === 3) {
              // Parameters: year, month, day, hour, minute, second, nanosecond
              return `time.Date(${date[0]}, ${getMonthString(date[1])}, ${
                date[2]
              }, ${time[0]}, ${time[1]}, ${time[2]}, 0, time.UTC)`;
            }
          } else if (d === 'CURRENT_TIMESTAMP') {
            return `time.Now()`;
          } else if (d === 'NOW()') {
            return `time.Now()`;
          }
        }
        return `${d}`;
      case AttrType.DECIMAL:
        return `${d}`;
      case AttrType.REAL:
        return `${d}`;
      case AttrType.FLOAT:
        return `${d}`;
      case AttrType.SERIAL:
        return `${d}`;
      case AttrType.INT:
        return `${d}`;
      case AttrType.BOOLEAN:
        return `${d}`;
      case AttrType.VARCHAR:
        return `"${d.replaceAll('"', '\\"')}"`;
      case AttrType.MONEY:
        return `${d}`;
    }
  }

  if (lang === Lang.TS) {
    function getMonthString(month: string): string {
      const months: { [key: string]: string } = {
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
        '12': '11',
      };

      const monthName = months[month];

      if (monthName) {
        return `time.${monthName}`;
      } else {
        return 'Invalid month';
      }
    }

    switch (a.Type) {
      case AttrType.BIT:
        return `${d}`;
      case AttrType.DATE:
        {
          let s = d.split('-');
          if (s.length === 3) {
            // const specificDate = new Date(Date.UTC(2021, 0, 1, 10, 45, 22, 0)); // January 1, 2021, 10:45:22 UTC
            return `new Date(Date.UTC(${s[0]}, ${getMonthString(s[1])}, ${
              s[2]
            }, 0, 0, 0, 0))`;
          } else if (d === 'CURRENT_DATE') {
            return `new Date()`;
          } else if (d === 'NOW()') {
            return `new Date()`;
          }
        }
        break;
      case AttrType.CHAR:
        if (d.length === 1) {
          return `'${d}'`;
        }
        break;
      case AttrType.TIME:
        {
          let s = d.split(':');
          if (s.length === 3) {
            // const specificDate = new Date(Date.UTC(2021, 0, 1, 10, 45, 22, 0)); // January 1, 2021, 10:45:22 UTC
            return `new Date(Date.UTC(1970, 0, 1, ${s[0]}, ${s[1]}, ${s[2]}, 0))`;
          } else if (d === 'CURRENT_TIME') {
            return `new Date()`;
          } else if (d === 'NOW()') {
            return `new Date()`;
          }
        }
        return `${d}`;
      case AttrType.TIMESTAMP:
        {
          let s = d.split(' ');
          if (s.length === 2) {
            let date = s[0].split('-');
            let time = s[1].split(':');
            if (date.length === 3 && time.length === 3) {
              // Parameters: year, month, day, hour, minute, second, nanosecond
              return `new Date(Date.UTC(${date[0]}, ${getMonthString(
                date[1]
              )}, ${date[2]}, ${time[0]}, ${time[1]}, ${time[2]}, 0))`;
            }
          } else if (d === 'CURRENT_TIMESTAMP') {
            return `new Date()`;
          } else if (d === 'NOW()') {
            return `new Date()`;
          }
        }
        return `${d}`;
      case AttrType.DECIMAL:
        return `${d}`;
      case AttrType.REAL:
        return `${d}`;
      case AttrType.FLOAT:
        return `${d}`;
      case AttrType.SERIAL:
        return `${d}`;
      case AttrType.INT:
        return `${d}`;
      case AttrType.BOOLEAN:
        return `${d}`;
      case AttrType.VARCHAR:
        return `'${d.replaceAll("'", "''")}'`;
      case AttrType.MONEY:
        return `${d}`;
    }
  }

  return null;
};

export const validationMap = new Map<AttrType, (x: string) => boolean>();
const validationMapPatterns = {
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^([01]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/,
  timestamp: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
  decimal: /^-?\d+(\.\d+)?$/,
  real: /^-?\d+(\.\d+)?$/,
  float: /^-?\d+(\.\d+)?$/,
  serial: /^[1-9]\d*$/,
  integer: /^-?\d+$/,
  boolean: /^(true|false)$/i,
  varchar: /^.*$/,
  money: /^-?\d+(\.\d{1,2})?$/,
};

const isSpecialValue = (x: string, specialValues: string[]): boolean => {
  return specialValues.includes(x.toUpperCase());
};

const matchesRegex = (x: string, regex: RegExp): boolean => {
  return regex.test(x);
};

// Function to get special values for each attribute type
const getSpecialValues = (attrType: AttrType): string[] => {
  switch (attrType) {
    case AttrType.DATE:
      return ['CURRENT_DATE', 'NOW()'];
    case AttrType.TIME:
      return ['CURRENT_TIME', 'NOW()'];
    case AttrType.TIMESTAMP:
      return ['CURRENT_TIMESTAMP', 'NOW()'];
    default:
      return [];
  }
};

validationMap.set(AttrType.BIT, (x: string) => ['1', '0'].includes(x));
validationMap.set(AttrType.DATE, (x: string) => {
  const specialValues = getSpecialValues(AttrType.DATE);
  if (isSpecialValue(x, specialValues)) return true;
  return matchesRegex(x, validationMapPatterns.date);
});
validationMap.set(AttrType.CHAR, (x: string) => x.length === 1);
validationMap.set(AttrType.TIME, (x: string) => {
  const specialValues = getSpecialValues(AttrType.TIME);
  if (isSpecialValue(x, specialValues)) return true;
  return matchesRegex(x, validationMapPatterns.time);
});

validationMap.set(AttrType.TIMESTAMP, (x: string) => {
  const specialValues = getSpecialValues(AttrType.TIMESTAMP);
  if (isSpecialValue(x, specialValues)) return true;
  return matchesRegex(x, validationMapPatterns.timestamp);
});

validationMap.set(AttrType.DECIMAL, (x: string) =>
  matchesRegex(x, validationMapPatterns.decimal)
);
validationMap.set(AttrType.REAL, (x: string) =>
  matchesRegex(x, validationMapPatterns.real)
);
validationMap.set(AttrType.FLOAT, (x: string) =>
  matchesRegex(x, validationMapPatterns.float)
);
validationMap.set(AttrType.SERIAL, (x: string) =>
  matchesRegex(x, validationMapPatterns.serial)
);
validationMap.set(AttrType.INT, (x: string) =>
  matchesRegex(x, validationMapPatterns.integer)
);
validationMap.set(AttrType.BOOLEAN, (x: string) =>
  matchesRegex(x, validationMapPatterns.boolean)
);
validationMap.set(AttrType.VARCHAR, (x: string) => typeof x === 'string');
validationMap.set(AttrType.MONEY, (x: string) =>
  matchesRegex(x, validationMapPatterns.money)
);

export const defaultValueValidatorHintMap = new Map<AttrType, string>();
defaultValueValidatorHintMap.set(AttrType.BIT, "'0' or '1'");
defaultValueValidatorHintMap.set(
  AttrType.DATE,
  "YYYY-MM-DD, 'CURRENT_DATE', or 'NOW()'"
);
defaultValueValidatorHintMap.set(
  AttrType.CHAR,
  'A fixed length string (e.g., 1 character)'
);
defaultValueValidatorHintMap.set(
  AttrType.TIME,
  "HH:MM:SS, 'CURRENT_TIME', or 'NOW()'"
);
defaultValueValidatorHintMap.set(
  AttrType.TIMESTAMP,
  "YYYY-MM-DD HH:MM:SS, 'CURRENT_TIMESTAMP', or 'NOW()'"
);
defaultValueValidatorHintMap.set(
  AttrType.DECIMAL,
  'A decimal point (e.g., 123.45, -12.3)'
);
defaultValueValidatorHintMap.set(
  AttrType.REAL,
  'A real number (e.g., 123.45, -12.3)'
);
defaultValueValidatorHintMap.set(
  AttrType.FLOAT,
  'A floating-point number (e.g., 123.45, -12.3)'
);
defaultValueValidatorHintMap.set(AttrType.SERIAL, 'A positive integer');
defaultValueValidatorHintMap.set(
  AttrType.INT,
  'Integer value (e.g., -123, 456)'
);
defaultValueValidatorHintMap.set(AttrType.BOOLEAN, "'true' or 'false'");
defaultValueValidatorHintMap.set(AttrType.VARCHAR, 'Any string is acceptable');
defaultValueValidatorHintMap.set(
  AttrType.MONEY,
  "Money: e.g., '12.34', or '-12.34'"
);
