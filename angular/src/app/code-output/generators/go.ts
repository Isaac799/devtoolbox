import { TAB } from '../../constants';
import { convertCase, alignKeyword, alignKeywords } from '../../formatting';
import {
  Table,
  AttrType,
  Schema,
  Attribute,
  AttributeNameWithTable,
} from '../../structure';

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
  lines.push(`type ${convertCase(t.Name, 'pascal')} struct {`);

  for (const a of t.Attributes) {
    let attrs = generateGoStructAttributes(a, false, SQL_TO_GO_TYPE);
    lines = lines.concat(attrs);
  }

  if (t.RefBy) {
    for (const tbl of t.RefBy) {
      let added = false;
      for (const a of tbl.Attributes) {
        if (!a.RefTo) continue;
        if (!a.Parent) continue;
        if (a.RefTo.ID === t.ID) continue;
        added = true;
        // console.log(t.Name, 'has', a.RefTo.Name);
        let many = `${TAB}${convertCase(
          `${a.RefTo.Name}s`,
          'pascal'
        )} ~[]${convertCase(a.RefTo.Name, 'pascal')} \`json:"${convertCase(
          `${a.RefTo.Name}s`,
          'snake'
        )}"\``;
        lines.push(many);
      }
      if (!added) {
        let one = `${TAB}${convertCase(tbl.Name, 'pascal')} ~*${convertCase(
          tbl.Name,
          'pascal'
        )} \`json:"${convertCase(tbl.Name, 'snake')}"\``;
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

  if (recursive) {
    lines.push(
      `${TAB}${convertCase(AttributeNameWithTable(a), 'pascal')} ${
        SQL_TO_GO_TYPE[a.Type]
      } \`json:"${convertCase(AttributeNameWithTable(a), 'snake')}"\``
    );
  } else {
    lines.push(
      `${TAB}${convertCase(a.Name, 'pascal')} ${
        SQL_TO_GO_TYPE[a.Type]
      } \`json:"${convertCase(a.Name, 'snake')}"\``
    );
  }

  return lines;
}

function generateGoFnStructAttributes(
  a: Attribute,
  recursive: boolean,
  SQL_TO_GO_TYPE: Record<AttrType, string>
): string[] {
  let lines: string[] = [];

  if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
    a.RefTo.Attributes;
    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) {
        continue;
      }
      let refAttrs = generateGoFnStructAttributes(ra, true, SQL_TO_GO_TYPE);
      lines = lines.concat(refAttrs);
    }
    return lines;
  }

  if (recursive) {
    lines.push(
      `${TAB}${TAB}${convertCase(
        AttributeNameWithTable(a),
        'pascal'
      )}: ${convertCase(AttributeNameWithTable(a), 'camel')},`
    );
  } else {
    lines.push(
      `${TAB}${TAB}${convertCase(a.Name, 'pascal')}: ${convertCase(
        a.Name,
        'camel'
      )},`
    );
  }

  return lines;
}

function generateGoFns(t: Table, SQL_TO_GO_TYPE: Record<AttrType, string>) {
  let lines: string[] = [];
  const n = convertCase(t.Name, 'pascal');

  let params: string[] = [];

  for (const a of t.Attributes) {
    if (a.RefTo) {
      for (const ra of a.RefTo.Attributes) {
        if (!ra.Option?.PrimaryKey) continue;
        params.push(
          `${convertCase(AttributeNameWithTable(ra), 'camel')} ${
            SQL_TO_GO_TYPE[ra.Type]
          }`
        );
      }

      continue;
    }
    params.push(`${convertCase(a.Name, 'camel')} ${SQL_TO_GO_TYPE[a.Type]}`);
  }

  lines.push(
    `func ${convertCase(`New_${t.Name}`, 'pascal')} (${params.join(
      ', '
    )}) *${n} {`
  );
  lines.push(`${TAB}return &${n} {`);

  let attrs: string[] = [];

  for (const a of t.Attributes) {
    let goFnStructAttributes = generateGoFnStructAttributes(
      a,
      false,
      SQL_TO_GO_TYPE
    );

    attrs = attrs.concat(goFnStructAttributes);
  }

  if (t.RefBy) {
    for (const tbl of t.RefBy) {
      let added = false;
      for (const a of tbl.Attributes) {
        if (!a.RefTo) continue;
        if (!a.Parent) continue;
        if (a.RefTo.ID === t.ID) continue;
        added = true;
        // console.log(t.Name, 'has', a.RefTo.Name);
        let many = `${TAB}${TAB}${convertCase(
          `${a.RefTo.Name}s`,
          'pascal'
        )}: []${convertCase(a.RefTo.Name, 'pascal')}{},`;
        attrs.push(many);
      }
      if (!added) {
        let one = `${TAB}${TAB}${convertCase(tbl.Name, 'pascal')}: nil,`;
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
