import { TAB } from '../../constants';
import {
  cc,
  alignKeyword,
  alignKeywords,
  fixPluralGrammar,
} from '../../formatting';
import {
  Table,
  AttrType,
  Schema,
  Attribute,
  SQL_TO_GO_TYPE,
} from '../../structure';

export function SchemasToGoStructs(schemas: Schema[]): string {
  let lines: string[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      let structs = generateGoStructs(t);
      lines = lines.concat(structs);
      lines.push('');
      let fns = generateGoFns(t);
      lines = lines.concat(fns);
      lines.push('');
    }
  }
  let str = lines.join('\n');
  return str;
}

function generateGoStructs(t: Table) {
  let lines: string[] = [];
  lines.push(`type ${cc(t.FN, 'pl')} struct {`);

  for (const a of t.Attributes) {
    let attrs = generateGoStructAttributes(a, false);
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
          cc(`${a.RefTo.FN}s`, 'pl')
        )} ~[]${cc(a.RefTo.FN, 'pl')} \`json:"${fixPluralGrammar(
          cc(`${a.RefTo.FN}s`, 'sk')
        )}"\``;
        lines.push(many);
      }
      if (!added) {
        let one = `${TAB}${cc(tbl.FN, 'pl')} ~*${cc(tbl.FN, 'pl')} \`json:"${cc(
          tbl.FN,
          'sk'
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
  recursive: boolean
): string[] {
  let lines: string[] = [];

  if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) {
        continue;
      }
      let refAttrs = generateGoStructAttributes(ra, true);
      lines = lines.concat(refAttrs);
    }
    return lines;
  }

  let nil = a.Validation?.Required || a.Option?.PrimaryKey ? '' : '*';
  let ty = `${nil}${SQL_TO_GO_TYPE[a.Type]}`;

  if (recursive) {
    lines.push(`${TAB}${cc(a.FN, 'pl')} ${ty} \`json:"${cc(a.FN, 'sk')}"\``);
  } else {
    lines.push(`${TAB}${cc(a.PFN, 'pl')} ${ty} \`json:"${cc(a.FN, 'sk')}"\``);
  }

  return lines;
}

function generateGoFnStructAttributes(
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
      let refAttrs = generateGoFnStructAttributes(ra, a);
      lines = lines.concat(refAttrs);
    }
    return lines;
  }

  if (recursive) {
    lines.push(`${TAB}${TAB}${cc(a.FN, 'pl')}: ${cc(recursive.FN, 'cm')},`);
  } else {
    lines.push(`${TAB}${TAB}${cc(a.PFN, 'pl')}: ${cc(a.FN, 'cm')},`);
  }

  return lines;
}

function generateGoFns(t: Table) {
  let lines: string[] = [];
  const n = cc(t.FN, 'pl');

  let params: string[] = [];

  for (const a of t.Attributes) {
    if (a.RefTo) {
      for (const ra of a.RefTo.Attributes) {
        if (!ra.Option?.PrimaryKey) continue;
        params.push(`${cc(a.FN, 'cm')} ${SQL_TO_GO_TYPE[ra.Type]}`);
      }

      continue;
    }
    params.push(`${cc(a.FN, 'cm')} ${SQL_TO_GO_TYPE[a.Type]}`);
  }

  lines.push(`func ${cc(`New_${t.FN}`, 'pl')} (${params.join(', ')}) *${n} {`);
  lines.push(`${TAB}return &${n} {`);

  let attrs: string[] = [];

  for (const a of t.Attributes) {
    let goFnStructAttributes = generateGoFnStructAttributes(a, null);

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
          cc(`${a.RefTo.FN}s`, 'pl')
        )}: []${cc(a.RefTo.FN, 'pl')}{},`;
        attrs.push(many);
      }
      if (!added) {
        let one = `${TAB}${TAB}${cc(tbl.FN, 'pl')}: nil,`;
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
