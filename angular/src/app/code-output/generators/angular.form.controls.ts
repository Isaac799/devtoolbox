import { TAB } from '../../constants';
import { cc, alignKeyword, fixPluralGrammar } from '../../formatting';
import { Table, AttrType, Schema, Attribute } from '../../structure';

const NUMERICS = [
  AttrType.DECIMAL,
  AttrType.REAL,
  AttrType.FLOAT,
  AttrType.SERIAL,
  AttrType.INT,
  // AttrType.VARCHAR,
  AttrType.MONEY,
];

export function SchemasToAngularFormControls(schemas: Schema[]): string {
  const SQL_TO_TS_TYPE: Record<AttrType, string> = {
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

  let lines: string[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      let structs = generateTsStructs(t, SQL_TO_TS_TYPE);
      lines = lines.concat(structs);
      lines.push('');
    }
  }
  let str = lines.join('\n');
  return str;
}

function generateTsStructs(t: Table, SQL_TO_TS_TYPE: Record<AttrType, string>) {
  let lines: string[] = [];
  lines.push(`${cc(`${t.FN}_form`, 'p')} = new FormGroup({`);

  for (const a of t.Attributes) {
    let attrs = generateTsStructAttributes(a, null, SQL_TO_TS_TYPE);
    lines = lines.concat(attrs);
  }

  if (t.RefBy) {
    for (const tbl of t.RefBy) {
      let added = false;
      for (const a of tbl.Attributes) {
        if (!a.RefTo) continue;
        if (a.RefTo.ID === t.ID) continue;
        added = true;

        let validatorsStr = GenerateValidatorsForAttribute(a);

        let many = `${TAB}${fixPluralGrammar(cc(`${a.RefTo.FN}s`, 'c'))}: new FormControl<${cc(
          a.RefTo.FN,
          'p'
        )}[] | null>({ value: null, disabled: false }, [${validatorsStr}])`;
        lines.push(many);
      }
      if (!added) {
        let validatorsStr = '';

        // find what its refed by to get its validation
        for (const a2 of tbl.Attributes) {
          if (!a2.RefTo || a2.RefTo.ID !== t.ID) {
            continue;
          }
          validatorsStr = GenerateValidatorsForAttribute(a2);
          break;
        }

        let one = `${TAB}${cc(tbl.FN, 'c')}: new FormControl<${cc(
          tbl.FN,
          'p'
        )} | null>({ value: null, disabled: false }, [${validatorsStr}])`;
        lines.push(one);
      }
    }
  }

  lines = lines.map((e, i) =>
    i === lines.length - 1 || i === 0 ? e : `${e},`
  );

  lines.push(`})`);

  lines = alignKeyword(lines, ':');

  return lines;
}

function generateTsStructAttributes(
  a: Attribute,
  recursive: Attribute | null,
  SQL_TO_TS_TYPE: Record<AttrType, string>
): string[] {
  let lines: string[] = [];

  if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) {
        continue;
      }
      let refAttrs = generateTsStructAttributes(ra, a, SQL_TO_TS_TYPE);
      lines = lines.concat(refAttrs);
    }
    return lines;
  }

  let validatorsStr = GenerateValidatorsForAttribute(a);

  if (recursive) {
    lines.push(
      `${TAB}${cc(recursive.FN, 'c')}: new FormControl<${
        SQL_TO_TS_TYPE[a.Type]
      } | null>({ value: null, disabled: false }, [${validatorsStr}])`
    );
  } else {
    lines.push(
      `${TAB}${cc(a.PFN, 'c')}: new FormControl<${
        SQL_TO_TS_TYPE[a.Type]
      } | null>({ value: null, disabled: false }, [${validatorsStr}])`
    );
  }

  return lines;
}

function GenerateValidatorsForAttribute(a: Attribute) {
  let validators: string[] = [];

  if (a.Validation?.Required) {
    validators.push('Validators.required');
  }
  if (a.Validation?.Min != undefined) {
    if (NUMERICS.includes(a.Type)) {
      validators.push(`Validators.min(${a.Validation?.Min})`);
    } else {
      validators.push(`Validators.minLength(${a.Validation?.Min})`);
    }
  }
  if (a.Validation?.Max != undefined) {
    if (NUMERICS.includes(a.Type)) {
      validators.push(`Validators.max(${a.Validation?.Max})`);
    } else {
      validators.push(`Validators.maxLength(${a.Validation?.Max})`);
    }
  }

  let validatorsStr = validators.join(', ');
  return validatorsStr;
}
