import { convertCase } from './formatting';

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
export type Attribute = {
  ID: number;
  Parent?: Table;
  RefTo?: Table;
  Name: string;
  Type: AttrType;
  Option?: AttributeOptions;
  Validation?: Validation;
};

// Schema represents the entire schema containing multiple tables
export type SchemaConfig = {
  ID: number;
  Tables: Record<string, TableConfig>;
};
// Schema represents the entire schema containing multiple tables
export type Schema = {
  ID: number;
  Name: string;
  Tables: Table[];
};

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
export type Table = {
  ID: number;
  Parent?: Schema;
  RefBy?: Table[];
  Name: string;
  // Options: TableOptions;
  Attributes: Attribute[];
};

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

export function AttributeNameWithTable(x: Attribute): string {
  if (!x.Parent) {
    return 'unknown';
  }
  return `${x.Parent.Name}.${x.Name}`;
}

export function AttributeNameWithSchemaAndTable(x: Attribute): string {
  if (!x.Parent?.Parent) {
    return 'unknown';
  }
  return `${convertCase(
    x.Parent.Parent.Name,
    'snake'
  )}.convertCase(x.Parent.Name, 'snake')}.${convertCase(x.Name, 'snake')}`;
}

export function TableFullName(x: Table): string {
  if (!x.Parent) {
    return 'unknown';
  }
  
  return `${convertCase(x.Parent.Name, 'snake')}.${convertCase(
    x.Name,
    'snake'
  )}`;
}

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
