import { TAB } from '../../constants';
import { convertCase, alignKeyword } from '../../formatting';
import {
  Table,
  AttrType,
  Schema,
  Attribute,
  AttributeNameWithTable,
} from '../../structure';

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
  lines.push(`type ${convertCase(t.Name, 'pascal')} = {`);

  for (const a of t.Attributes) {
    let attrs = generateTsStructAttributes(a, false, SQL_TO_TS_TYPE);
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
        )}: ${convertCase(a.RefTo.Name, 'pascal')}[] | null`;
        lines.push(many);
      }
      if (!added) {
        let one = `${TAB}${convertCase(tbl.Name, 'pascal')}: ${convertCase(
          tbl.Name,
          'pascal'
        )} | null`;
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
  recursive: boolean,
  SQL_TO_TS_TYPE: Record<AttrType, string>
): string[] {
  let lines: string[] = [];

  if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) {
        continue;
      }
      let refAttrs = generateTsStructAttributes(ra, true, SQL_TO_TS_TYPE);
      lines = lines.concat(refAttrs);
    }
    return lines;
  }

  if (recursive) {
    lines.push(
      `${TAB}${convertCase(AttributeNameWithTable(a), 'pascal')}: ${
        SQL_TO_TS_TYPE[a.Type]
      }`
    );
  } else {
    lines.push(
      `${TAB}${convertCase(a.Name, 'pascal')}: ${SQL_TO_TS_TYPE[a.Type]}`
    );
  }

  return lines;
}

function generateTsFnStructAttributes(
  a: Attribute,
  recursive: boolean,
  SQL_TO_TS_TYPE: Record<AttrType, string>
): string[] {
  let lines: string[] = [];

  if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
    a.RefTo.Attributes;
    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) {
        continue;
      }
      let refAttrs = generateTsFnStructAttributes(ra, true, SQL_TO_TS_TYPE);
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

function generateTsFns(t: Table, SQL_TO_TS_TYPE: Record<AttrType, string>) {
  let lines: string[] = [];
  const n = convertCase(t.Name, 'pascal');

  let params: string[] = [];

  for (const a of t.Attributes) {
    if (a.RefTo) {
      for (const ra of a.RefTo.Attributes) {
        if (!ra.Option?.PrimaryKey) continue;
        params.push(
          `${convertCase(AttributeNameWithTable(ra), 'camel')}: ${
            SQL_TO_TS_TYPE[ra.Type]
          }`
        );
      }

      continue;
    }
    params.push(`${convertCase(a.Name, 'camel')}: ${SQL_TO_TS_TYPE[a.Type]}`);
  }

  lines.push(
    `function ${convertCase(`New_${t.Name}`, 'pascal')} (${params.join(
      ', '
    )}): ${n} {`
  );
  lines.push(`${TAB}return {`);

  let attrs: string[] = [];

  for (const a of t.Attributes) {
    let goFnStructAttributes = generateTsFnStructAttributes(
      a,
      false,
      SQL_TO_TS_TYPE
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
        )}: null,`;
        attrs.push(many);
      }
      if (!added) {
        let one = `${TAB}${TAB}${convertCase(tbl.Name, 'pascal')}: null,`;
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
