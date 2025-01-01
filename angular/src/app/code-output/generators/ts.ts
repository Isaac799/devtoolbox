import { TAB } from '../../constants';
import { cc, alignKeyword, fixPluralGrammar } from '../../formatting';
import { Table, AttrType, Schema, Attribute } from '../../structure';

export function SchemasToTsStructs(schemas: Schema[]): string {
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
      let fns = generateTsFns(t, SQL_TO_TS_TYPE);
      lines = lines.concat(fns);
      lines.push('');
    }
  }
  let str = lines.join('\n');
  return str;
}

function generateTsStructs(t: Table, SQL_TO_TS_TYPE: Record<AttrType, string>) {
  let lines: string[] = [];
  lines.push(`type ${cc(t.FN, 'p')} = {`);

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

        let many = `${TAB}${fixPluralGrammar(cc(`${a.RefTo.FN}s`, 'c'))}: ${cc(
          a.RefTo.FN,
          'p'
        )}[] | null`;
        lines.push(many);
      }
      if (!added) {
        let one = `${TAB}${cc(tbl.FN, 'c')}: ${cc(tbl.FN, 'p')} | null`;
        lines.push(one);
      }
    }
  }

  lines.push(`}`);
  // lines = alignKeywords(lines, [...Object.values(SQL_TO_TS_TYPE)]);
  lines = alignKeyword(lines, ':');
  lines = alignKeyword(lines, '| null');
  lines = alignKeyword(lines, '`json:');
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

  if (recursive) {
    lines.push(`${TAB}${cc(recursive.FN, 'c')}: ${SQL_TO_TS_TYPE[a.Type]}`);
  } else {
    let nil = a.Validation?.Required || a.Option?.PrimaryKey ? '' : ' | null';
    lines.push(`${TAB}${cc(a.PFN, 'c')}: ${SQL_TO_TS_TYPE[a.Type]}${nil}`);
  }

  return lines;
}

function generateTsFnStructAttributes(
  a: Attribute,
  recursive: Attribute | null,
  SQL_TO_TS_TYPE: Record<AttrType, string>
): string[] {
  let lines: string[] = [];

  if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
    a.RefTo.Attributes;
    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) {
        continue;
      }
      let refAttrs = generateTsFnStructAttributes(ra, a, SQL_TO_TS_TYPE);
      lines = lines.concat(refAttrs);
    }
    return lines;
  }

  if (recursive) {
    // lines.push(`${TAB}${TAB}${cc(a.FN, 'c')}: ${cc(a.FN, 'c')},`);
    lines.push(`${TAB}${TAB}${cc(recursive.FN, 'c')},`);
  } else {
    lines.push(`${TAB}${TAB}${cc(a.PFN, 'c')},`);
  }

  return lines;
}

function generateTsFns(t: Table, SQL_TO_TS_TYPE: Record<AttrType, string>) {
  let lines: string[] = [];
  const fnTy = cc(t.FN, 'p');

  let params: string[] = [];

  for (const a of t.Attributes) {
    if (a.RefTo) {
      for (const ra of a.RefTo.Attributes) {
        if (!ra.Option?.PrimaryKey) continue;
        params.push(`${cc(a.FN, 'c')}: ${SQL_TO_TS_TYPE[ra.Type]}`);
      }

      continue;
    }
    params.push(`${cc(a.PFN, 'c')}: ${SQL_TO_TS_TYPE[a.Type]}`);
  }

  lines.push(
    `function ${cc(`New_${t.FN}`, 'c')} (${params.join(', ')}): ${fnTy} {`
  );
  lines.push(`${TAB}return {`);

  let attrs: string[] = [];

  for (const a of t.Attributes) {
    let goFnStructAttributes = generateTsFnStructAttributes(
      a,
      null,
      SQL_TO_TS_TYPE
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

        let many = `${TAB}${TAB}${fixPluralGrammar(
          cc(`${a.RefTo.FN}s`, 'c')
        )}: null,`;
        attrs.push(many);
      }
      if (!added) {
        let one = `${TAB}${TAB}${cc(tbl.FN, 'c')}: null,`;
        attrs.push(one);
      }
    }
  }

  attrs = alignKeyword(attrs, ':');
  lines = lines.concat(attrs);

  lines.push(`${TAB}}`);
  lines.push(`}`);

  return lines;
}
