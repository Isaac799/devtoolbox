import { cc } from './formatting';

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
    return [cc(this.Parent.Name, 's'), cc(this.Name, 's')].join('.');
  }

  get FN(): string {
    return [cc(this.Parent.Parent.Name, 's'), this.PFN].join('.');
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
    return [cc(this.Parent.Name, 's'), cc(this.Name, 's')].join('.');
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
