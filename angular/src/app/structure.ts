// Validation holds validation rules for an attribute
export type Validation = {
  Required?: boolean;
  Min?: number;
  Max?: number;
};

// Options holds additional options for attributes and tables
export type AttributeOptions = {
  PrimaryKey?: boolean;
  Readonly?: boolean;
  // Unique?: string[];
  Unique?: boolean;
  Default?: string;
};

// Attribute represents an individual attribute of a table
export type Attribute = {
  id: number;
  parent_id: number;
  Name: string;
  Type: AttrType;
  Options?: AttributeOptions;
  Validation?: Validation;
};

// Schema represents the entire schema containing multiple tables
export type Schema = {
  id: number;
  Name: string;
  Tables: Table[];
};

// // Options holds additional options for attributes and tables
// export type TableOptions = {
//   AutoPrimaryKey: boolean;
//   AutoTimestamps: boolean;
// };

// Table represents a database table with its attributes and options
export type Table = {
  id: number;
  parent_id: number;
  Name: string;
  // Options: TableOptions;
  Attributes: Attribute[];
};

export enum AppMode {
  JSON,
  YAML,
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
}

export type App = {
  mode: AppMode;
  complexity: AppComplexityMode;
};
