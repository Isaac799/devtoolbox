import { AttrType } from './structure';

export const TAB = '    ';

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

validationMap.set(AttrType.BIT, (x: string) => ['1', '0'].includes(x));
validationMap.set(AttrType.DATE, (x: string) => {
  const specialValues = ['CURRENT_DATE', 'NOW()'];
  if (isSpecialValue(x, specialValues)) return true;
  return matchesRegex(x, validationMapPatterns.date);
});
validationMap.set(AttrType.CHAR, (x: string) => x.length === 1);
validationMap.set(AttrType.TIME, (x: string) => {
  const specialValues = ['CURRENT_TIME', 'NOW()'];
  if (isSpecialValue(x, specialValues)) return true;
  return matchesRegex(x, validationMapPatterns.time);
});

validationMap.set(AttrType.TIMESTAMP, (x: string) => {
  const specialValues = ['CURRENT_TIMESTAMP', 'NOW()'];
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

export const defaultConfig: any = {
  public: {
    ID: 13,
    Tables: {
      user: {
        ID: 14,
        ParentID: 13,
        Attributes: {
          id: {
            ID: 16,
            ParentID: 14,
            Type: 'SERIAL',
            Option: { Unique: false, PrimaryKey: true },
          },
          name: {
            ID: 18,
            ParentID: 14,
            Type: 'VARCHAR',
            Option: { Unique: true, PrimaryKey: false },
            Validation: { Min: 3, Max: 31, Required: true },
          },
          email: {
            ID: 36,
            ParentID: 14,
            Type: 'VARCHAR',
            Option: { Default: null, Unique: true, PrimaryKey: null },
            Validation: { Min: 5, Max: 63, Required: true },
          },
        },
      },
      profile: {
        ID: 15,
        ParentID: 13,
        Attributes: {
          bio: {
            ID: 19,
            ParentID: 15,
            Type: 'VARCHAR',
            Option: { PrimaryKey: false },
            Validation: { Max: 255, Required: false },
          },
          user: {
            ID: 20,
            ParentID: 15,
            RefToID: 14,
            Type: 'REF',
            Option: { PrimaryKey: true },
            Validation: { Required: false },
          },
          status: {
            ID: 32,
            ParentID: 15,
            Type: 'CHARACTER',
            Option: { Default: 'z', Unique: null, PrimaryKey: null },
            Validation: { Min: null, Max: null, Required: true },
          },
        },
      },
      item: {
        ID: 21,
        ParentID: 13,
        Attributes: {
          id: {
            ID: 22,
            ParentID: 21,
            Type: 'SERIAL',
            Option: { Unique: false, PrimaryKey: true },
          },
          description: {
            ID: 23,
            ParentID: 21,
            Type: 'VARCHAR',
            Validation: { Min: 3, Max: 255, Required: true },
          },
        },
      },
      listing: {
        ID: 24,
        ParentID: 13,
        Attributes: {
          listee: {
            ID: 25,
            ParentID: 24,
            RefToID: 14,
            Type: 'REF',
            Option: { PrimaryKey: true },
            Validation: { Required: false },
          },
          item: {
            ID: 26,
            ParentID: 24,
            RefToID: 21,
            Type: 'REF',
            Option: { PrimaryKey: true },
            Validation: { Required: false },
          },
          inserted_at: {
            ID: 33,
            ParentID: 24,
            Type: 'TIMESTAMP',
            Option: {
              Default: 'CURRENT_TIMESTAMP',
              Unique: null,
              PrimaryKey: false,
            },
          },
          sold: {
            ID: 37,
            ParentID: 24,
            Type: 'BOOLEAN',
            Option: { Default: 'false', Unique: null, PrimaryKey: null },
            Validation: { Min: null, Max: null, Required: true },
          },
        },
      },
    },
  },
  finance: {
    ID: 27,
    Tables: {
      purchase: {
        ID: 28,
        ParentID: 27,
        Attributes: {
          payer: {
            ID: 29,
            ParentID: 28,
            RefToID: 14,
            Type: 'REF',
            Option: { PrimaryKey: true },
            Validation: { Required: false },
          },
          what: {
            ID: 30,
            ParentID: 28,
            RefToID: 21,
            Type: 'REF',
            Option: { PrimaryKey: true, Unique: true },
            Validation: { Required: false },
          },
          when: {
            ID: 31,
            ParentID: 28,
            Type: 'TIMESTAMP',
            Option: { Default: 'CURRENT_TIMESTAMP', PrimaryKey: false },
          },
          amount: {
            ID: 34,
            ParentID: 28,
            Type: 'MONEY',
            Option: { Default: '' },
            Validation: { Min: 0.01, Max: 999.99, Required: true },
          },
          status: {
            ID: 35,
            ParentID: 28,
            Type: 'CHARACTER',
            Option: { Default: 'p' },
            Validation: { Required: true },
          },
        },
      },
    },
  },
};

// Define a type for the input array of objects
export type Grouped<T> = {
  [key: string]: T[];
};

// Function to group items by a property
export const groupBy = <T, K extends keyof T>(
  arr: T[],
  prop: K
): Grouped<T> => {
  return arr.reduce((acc, item) => {
    const key = item[prop] as unknown as string; // Get the value of the property to group by

    // If the group doesn't exist, create it
    if (!acc[key]) {
      acc[key] = [];
    }

    // Add the item to the corresponding group
    acc[key].push(item);

    return acc;
  }, {} as Grouped<T>);
};
