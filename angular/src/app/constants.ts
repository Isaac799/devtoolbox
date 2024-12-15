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
