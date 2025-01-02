import { TAB } from '../../constants';
import { cc, alignKeyword, fixPluralGrammar } from '../../formatting';
import {
  Table,
  AttrType,
  Schema,
  Attribute,
  SQL_TO_TS_TYPE,
} from '../../structure';

export function SchemasToTsStructs(schemas: Schema[]): string {
  let lines: string[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      let structs = generateTsStructs(t);
      lines = lines.concat(structs);
      lines.push('');
      let fns = generateTsFns(t);
      lines = lines.concat(fns);
      lines.push('');
    }
  }
  let str = lines.join('\n');
  return str;
}

function generateTsStructs(t: Table) {
  let lines: string[] = [];
  lines.push(`type ${cc(t.FN, 'pl')} = {`);

  for (const a of t.Attributes) {
    let attrs = generateTsStructAttributes(a, null);
    lines = lines.concat(attrs);
  }

  if (t.RefBy) {
    for (const tbl of t.RefBy) {
      let added = false;
      for (const a of tbl.Attributes) {
        if (!a.RefTo) continue;
        if (a.RefTo.ID === t.ID) continue;
        added = true;

        let many = `${TAB}${fixPluralGrammar(cc(`${a.RefTo.FN}s`, 'cm'))}: ${cc(
          a.RefTo.FN,
          'pl'
        )}[] | null`;
        lines.push(many);
      }
      if (!added) {
        let one = `${TAB}${cc(tbl.FN, 'cm')}: ${cc(tbl.FN, 'pl')} | null`;
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
  recursive: Attribute | null
): string[] {
  let lines: string[] = [];

  if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) {
        continue;
      }
      let refAttrs = generateTsStructAttributes(ra, a);
      lines = lines.concat(refAttrs);
    }
    return lines;
  }

  if (recursive) {
    lines.push(`${TAB}${cc(recursive.FN, 'cm')}: ${SQL_TO_TS_TYPE[a.Type]}`);
  } else {
    let nil = a.Validation?.Required || a.Option?.PrimaryKey ? '' : ' | null';
    lines.push(`${TAB}${cc(a.PFN, 'cm')}: ${SQL_TO_TS_TYPE[a.Type]}${nil}`);
  }

  return lines;
}

function generateTsFnStructAttributes(
  a: Attribute,
  recursive: Attribute | null
): string[] {
  let lines: string[] = [];

  if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
    a.RefTo.Attributes;
    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) {
        continue;
      }
      let refAttrs = generateTsFnStructAttributes(ra, a);
      lines = lines.concat(refAttrs);
    }
    return lines;
  }

  if (recursive) {
    // lines.push(`${TAB}${TAB}${cc(a.FN, 'c')}: ${cc(a.FN, 'c')},`);
    lines.push(`${TAB}${TAB}${cc(recursive.FN, 'cm')},`);
  } else {
    lines.push(`${TAB}${TAB}${cc(a.PFN, 'cm')},`);
  }

  return lines;
}

function generateTsFns(t: Table) {
  let lines: string[] = [];
  const fnTy = cc(t.FN, 'pl');

  let params: string[] = [];

  for (const a of t.Attributes) {
    if (a.RefTo) {
      for (const ra of a.RefTo.Attributes) {
        if (!ra.Option?.PrimaryKey) continue;
        params.push(`${cc(a.FN, 'cm')}: ${SQL_TO_TS_TYPE[ra.Type]}`);
      }

      continue;
    }
    params.push(`${cc(a.PFN, 'cm')}: ${SQL_TO_TS_TYPE[a.Type]}`);
  }

  lines.push(
    `function ${cc(`New_${t.FN}`, 'cm')} (${params.join(', ')}): ${fnTy} {`
  );
  lines.push(`${TAB}return {`);

  let attrs: string[] = [];

  for (const a of t.Attributes) {
    let goFnStructAttributes = generateTsFnStructAttributes(a, null);

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
          cc(`${a.RefTo.FN}s`, 'cm')
        )}: null,`;
        attrs.push(many);
      }
      if (!added) {
        let one = `${TAB}${TAB}${cc(tbl.FN, 'cm')}: null,`;
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
