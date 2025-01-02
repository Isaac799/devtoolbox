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
  label: string;
  type: string;

  constructor(l: string, t: string) {
    this.label = l;
    this.type = t;
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
    this.outputs = this.genFnOutputs();
  }

  genFnInputs(): FuncIn[] {
    let inputs: FuncIn[] = [];

    for (const a of this.table.Attributes) {
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

  genFnOutputs(): FuncOut[] {
    let outputs: FuncOut[] = [];

    for (const a of this.table.Attributes) {
      let goFnStructAttributes = this.genFnOutput(a, null);
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

          let { label, type } = genLabelType(
            'out',
            fakeA,
            fakeA,
            this.lang,
            relation,
            Cardinality.Many,
            a.RefTo.FN
          );
          outputs.push(new FuncOut(label, type));
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

          let { label, type } = genLabelType(
            'out',
            fakeA,
            fakeA,
            this.lang,
            relation,
            Cardinality.One,
            tbl.FN
          );
          outputs.push(new FuncOut(label, type));

          // inputs.push(new FuncIn(cc(tbl.FN, 'pl'), `nil`));
        }
      }
    }

    return outputs;
  }

  genFnOutput(a: Attribute, recursive: Attribute | null): FuncOut[] {
    let answer: FuncOut[] = [];

    if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
      a.RefTo.Attributes;
      for (const ra of a.RefTo.Attributes) {
        if (!ra.Option?.PrimaryKey) {
          continue;
        }
        let refAttrs = this.genFnOutput(ra, a);
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

      let { label, type } = genLabelType(
        'out',
        a,
        recursive,
        this.lang,
        relation,
        Cardinality.Self
      );
      answer.push(new FuncOut(label, type));
    } else {
      let { label, type } = genLabelType(
        'out',
        a,
        a,
        this.lang,
        Rel.SameTable,
        Cardinality.Self
      );
      answer.push(new FuncOut(label, type));
    }
    return answer;
  }

  private determineTitle(): string {
    let map: Record<Lang, string> = {
      [Lang.PGSQL]: cc(this.table.Name, 'sk'),
      [Lang.TSQL]: cc(this.table.Name, 'sk'),
      [Lang.GO]: cc(this.table.Name, 'pl'),
      [Lang.TS]: cc(this.table.Name, 'cm'),
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

function genLabelType(
  io: 'in' | 'out',
  aL: Attribute,
  aT: Attribute,
  lang: Lang,
  relation: Rel,
  cardinality: Cardinality,
  overrideType: string = ''
): { label: string; type: string } {
  let map = new Map<number, { label: string; type: string }>();

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
  });
  map.set(Lang.PGSQL | Rel.SameSchema | Cardinality.Self, {
    label: cc(aL.PFN, psqlCase),
    type: psqlType,
  });
  map.set(Lang.PGSQL | Rel.DiffSchema | Cardinality.Self, {
    label: cc(aL.FN, psqlCase),
    type: psqlType,
  });

  //    -    -

  map.set(Lang.PGSQL | Rel.SameTable | Cardinality.One, {
    label: cc(aL.Name, psqlCase),
    type: psqlType,
  });
  map.set(Lang.PGSQL | Rel.SameSchema | Cardinality.One, {
    label: cc(aL.PFN, psqlCase),
    type: psqlType,
  });
  map.set(Lang.PGSQL | Rel.DiffSchema | Cardinality.One, {
    label: cc(aL.FN, psqlCase),
    type: psqlType,
  });

  //    -    -

  map.set(Lang.PGSQL | Rel.SameTable | Cardinality.Many, {
    label: fixPluralGrammar(cc(aL.Name, psqlCase) + 's'),
    type: psqlType,
  });
  map.set(Lang.PGSQL | Rel.SameSchema | Cardinality.Many, {
    label: fixPluralGrammar(cc(aL.PFN, psqlCase) + 's'),
    type: psqlType,
  });
  map.set(Lang.PGSQL | Rel.DiffSchema | Cardinality.Many, {
    label: fixPluralGrammar(cc(aL.FN, psqlCase) + 's'),
    type: psqlType,
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
  });
  map.set(Lang.TSQL | Rel.SameSchema | Cardinality.Self, {
    label: cc(aL.PFN, tsqlCase),
    type: tsqlType,
  });
  map.set(Lang.TSQL | Rel.DiffSchema | Cardinality.Self, {
    label: cc(aL.FN, tsqlCase),
    type: tsqlType,
  });

  //    -    -

  map.set(Lang.TSQL | Rel.SameTable | Cardinality.One, {
    label: cc(aL.Name, tsqlCase),
    type: tsqlType,
  });
  map.set(Lang.TSQL | Rel.SameSchema | Cardinality.One, {
    label: cc(aL.PFN, tsqlCase),
    type: tsqlType,
  });
  map.set(Lang.TSQL | Rel.DiffSchema | Cardinality.One, {
    label: cc(aL.FN, tsqlCase),
    type: tsqlType,
  });

  //    -    -

  map.set(Lang.TSQL | Rel.SameTable | Cardinality.Many, {
    label: fixPluralGrammar(cc(aL.Name, tsqlCase) + 's'),
    type: tsqlType,
  });
  map.set(Lang.TSQL | Rel.SameSchema | Cardinality.Many, {
    label: fixPluralGrammar(cc(aL.PFN, tsqlCase) + 's'),
    type: tsqlType,
  });
  map.set(Lang.TSQL | Rel.DiffSchema | Cardinality.Many, {
    label: fixPluralGrammar(cc(aL.FN, tsqlCase) + 's'),
    type: tsqlType,
  });

  //#endregion

  //#region Typescript

  const tsNullable =
    aL.Validation?.Required || aL.Option?.PrimaryKey ? '' : ' | null';
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
  });
  map.set(Lang.TS | Rel.SameSchema | Cardinality.Self, {
    label: cc(aL.PFN, tsCase),
    type: tsType + tsNullable,
  });
  map.set(Lang.TS | Rel.DiffSchema | Cardinality.Self, {
    label: cc(aL.FN, tsCase),
    type: tsType + tsNullable,
  });

  //    -    -

  map.set(Lang.TS | Rel.SameTable | Cardinality.One, {
    label: cc(aL.Name, tsCase),
    type: tsType + tsNullable,
  });
  map.set(Lang.TS | Rel.SameSchema | Cardinality.One, {
    label: cc(aL.PFN, tsCase),
    type: tsType + tsNullable,
  });
  map.set(Lang.TS | Rel.DiffSchema | Cardinality.One, {
    label: cc(aL.FN, tsCase),
    type: tsType + tsNullable,
  });

  //    -    -

  map.set(Lang.TS | Rel.SameTable | Cardinality.Many, {
    label: overrideType
      ? tsOverrideTypeRelatedLabel
      : fixPluralGrammar(cc(aL.Name, tsCase) + 's'),
    type: `Array<${tsType}>` + tsNullable,
  });
  map.set(Lang.TS | Rel.SameSchema | Cardinality.Many, {
    label: overrideType
      ? tsOverrideTypeRelatedLabel
      : fixPluralGrammar(cc(aL.PFN, tsCase) + 's'),
    type: `Array<${tsType}>` + tsNullable,
  });
  map.set(Lang.TS | Rel.DiffSchema | Cardinality.Many, {
    label: overrideType
      ? tsOverrideTypeRelatedLabel
      : fixPluralGrammar(cc(aL.FN, tsCase) + 's'),
    type: `Array<${tsType}>` + tsNullable,
  });

  //#endregion

  //#region Go Lang

  const goNullable =
    aL.Validation?.Required || aL.Option?.PrimaryKey ? '' : '*';
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
  });
  map.set(Lang.GO | Rel.SameSchema | Cardinality.Self, {
    label: cc(aL.PFN, goCase),
    type: goNullable + goType,
  });
  map.set(Lang.GO | Rel.DiffSchema | Cardinality.Self, {
    label: cc(aL.FN, goCase),
    type: goNullable + goType,
  });

  //    -    -

  map.set(Lang.GO | Rel.SameTable | Cardinality.One, {
    label: cc(aL.Name, goCase),
    type: io === 'in' ? goType : goNullable + goType + '{}',
  });
  map.set(Lang.GO | Rel.SameSchema | Cardinality.One, {
    label: cc(aL.PFN, goCase),
    type: io === 'in' ? goType : goNullable + goType + '{}',
  });
  map.set(Lang.GO | Rel.DiffSchema | Cardinality.One, {
    label: cc(aL.FN, goCase),
    type: io === 'in' ? goType : goNullable + goType + '{}',
  });

  //    -    -

  map.set(Lang.GO | Rel.SameTable | Cardinality.Many, {
    label: overrideType
      ? goOverrideTypeRelatedLabel
      : fixPluralGrammar(cc(aL.Name, goCase) + 's'),
    type: '[]' + goType + '{}',
  });
  map.set(Lang.GO | Rel.SameSchema | Cardinality.Many, {
    label: overrideType
      ? goOverrideTypeRelatedLabel
      : fixPluralGrammar(cc(aL.PFN, goCase) + 's'),
    type: '[]' + goType + '{}',
  });
  map.set(Lang.GO | Rel.DiffSchema | Cardinality.Many, {
    label: overrideType
      ? goOverrideTypeRelatedLabel
      : fixPluralGrammar(cc(aL.FN, goCase) + 's'),
    type: '[]' + goType + '{}',
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
    };
  }
  return answer;
}
