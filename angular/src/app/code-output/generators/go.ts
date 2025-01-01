import { TAB } from '../../constants';
import {
  cc,
  alignKeyword,
  alignKeywords,
  fixPluralGrammar,
} from '../../formatting';
import { Table, AttrType, Schema, Attribute } from '../../structure';

export function SchemasToGoStructs(schemas: Schema[]): string {
  const SQL_TO_GO_TYPE: Record<AttrType, string> = {
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

  let lines: string[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      let structs = generateGoStructs(t, SQL_TO_GO_TYPE);
      lines = lines.concat(structs);
      lines.push('');
      let fns = generateGoFns(t, SQL_TO_GO_TYPE);
      lines = lines.concat(fns);
      lines.push('');
    }
  }
  let str = lines.join('\n');
  return str;
}

function generateGoStructs(t: Table, SQL_TO_GO_TYPE: Record<AttrType, string>) {
  let lines: string[] = [];
  lines.push(`type ${cc(t.FN, 'p')} struct {`);

  for (const a of t.Attributes) {
    let attrs = generateGoStructAttributes(a, false, SQL_TO_GO_TYPE);
    lines = lines.concat(attrs);
  }

  if (t.RefBy) {
    for (const tbl of t.RefBy) {
      let added = false;
      for (const a of tbl.Attributes) {
        if (!a.RefTo) continue;
        if (a.RefTo.ID === t.ID) continue;
        added = true;
        // console.log(t.FN, 'has', a.RefTo.FN);
        let many = `${TAB}${fixPluralGrammar(
          cc(`${a.RefTo.FN}s`, 'p')
        )} ~[]${cc(a.RefTo.FN, 'p')} \`json:"${fixPluralGrammar(
          cc(`${a.RefTo.FN}s`, 's')
        )}"\``;
        lines.push(many);
      }
      if (!added) {
        let one = `${TAB}${cc(tbl.FN, 'p')} ~*${cc(tbl.FN, 'p')} \`json:"${cc(
          tbl.FN,
          's'
        )}"\``;
        lines.push(one);
      }
    }
  }

  lines.push(`}`);
  lines = alignKeywords(lines, ['~', '*', ...Object.values(SQL_TO_GO_TYPE)]);
  lines = lines.map((e) => e.replace('~', ''));
  lines = alignKeyword(lines, '`json:');
  return lines;
}

function generateGoStructAttributes(
  a: Attribute,
  recursive: boolean,
  SQL_TO_GO_TYPE: Record<AttrType, string>
): string[] {
  let lines: string[] = [];

  if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) {
        continue;
      }
      let refAttrs = generateGoStructAttributes(ra, true, SQL_TO_GO_TYPE);
      lines = lines.concat(refAttrs);
    }
    return lines;
  }

  let nil = a.Validation?.Required || a.Option?.PrimaryKey ? '' : '*';
  let ty = `${nil}${SQL_TO_GO_TYPE[a.Type]}`;
  if (recursive) {
    lines.push(`${TAB}${cc(a.FN, 'p')} ${ty} \`json:"${cc(a.FN, 's')}"\``);
  } else {
    lines.push(`${TAB}${cc(a.PFN, 'p')} ${ty} \`json:"${cc(a.FN, 's')}"\``);
  }

  return lines;
}

function generateGoFnStructAttributes(
  a: Attribute,
  recursive: Attribute | null,
  SQL_TO_GO_TYPE: Record<AttrType, string>
): string[] {
  let lines: string[] = [];

  if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
    a.RefTo.Attributes;
    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) {
        continue;
      }
      let refAttrs = generateGoFnStructAttributes(ra, a, SQL_TO_GO_TYPE);
      lines = lines.concat(refAttrs);
    }
    return lines;
  }

  if (recursive) {
    lines.push(`${TAB}${TAB}${cc(a.FN, 'p')}: ${cc(recursive.FN, 'c')},`);
  } else {
    lines.push(`${TAB}${TAB}${cc(a.PFN, 'p')}: ${cc(a.FN, 'c')},`);
  }

  return lines;
}

function generateGoFns(t: Table, SQL_TO_GO_TYPE: Record<AttrType, string>) {
  let lines: string[] = [];
  const n = cc(t.FN, 'p');

  let params: string[] = [];

  for (const a of t.Attributes) {
    if (a.RefTo) {
      for (const ra of a.RefTo.Attributes) {
        if (!ra.Option?.PrimaryKey) continue;
        params.push(`${cc(a.FN, 'c')} ${SQL_TO_GO_TYPE[ra.Type]}`);
      }

      continue;
    }
    params.push(`${cc(a.FN, 'c')} ${SQL_TO_GO_TYPE[a.Type]}`);
  }

  lines.push(`func ${cc(`New_${t.FN}`, 'p')} (${params.join(', ')}) *${n} {`);
  lines.push(`${TAB}return &${n} {`);

  let attrs: string[] = [];

  for (const a of t.Attributes) {
    let goFnStructAttributes = generateGoFnStructAttributes(
      a,
      null,
      SQL_TO_GO_TYPE
    );

    attrs = attrs.concat(goFnStructAttributes);
  }

  if (t.RefBy) {
    for (const tbl of t.RefBy) {
      let added = false;
      for (const a of tbl.Attributes) {
        if (!a.RefTo) continue;
        if (a.RefTo.ID === t.ID) continue;
        added = true;
        // console.log(t.FN, 'has', a.RefTo.FN);
        let many = `${TAB}${TAB}${fixPluralGrammar(
          cc(`${a.RefTo.FN}s`, 'p')
        )}: []${cc(a.RefTo.FN, 'p')}{},`;
        attrs.push(many);
      }
      if (!added) {
        let one = `${TAB}${TAB}${cc(tbl.FN, 'p')}: nil,`;
        attrs.push(one);
      }
    }
  }

  lines = lines.concat(attrs);
  lines = alignKeyword(lines, ':');

  lines.push(`${TAB}}`);
  lines.push(`}`);

  return lines;
}
