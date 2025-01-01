import { SQL_TO_TSQL_TYPE, TAB } from '../../constants';
import { cc, alignKeyword, alignKeywords } from '../../formatting';
import { Table, AttrType, Schema, Attribute } from '../../structure';

export function SchemasToTablesForTSQL(schemas: Schema[]): string {
  let drops: string[] = [];
  let createTableLines: string[] = [];
  for (const s of schemas) {
    drops.push(
      `IF EXISTS (SELECT * FROM sys.schemas WHERE name = '${cc(s.Name, 's')}') 
    DROP SCHEMA ${cc(s.Name, 's')};`
    );
    createTableLines.push('');
    createTableLines.push(
      `IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${cc(
        s.Name,
        's'
      )}') 
    CREATE SCHEMA ${cc(s.Name, 's')};`
    );
    createTableLines.push('');
    for (const t of s.Tables) {
      drops.push(
        `IF OBJECT_ID('${cc(t.Name, 's')}', 'U') IS NOT NULL 
    DROP TABLE ${t.FN};`
      );
      createTableLines.push(`CREATE TABLE ${t.FN} (`);
      let attrs: string[] = generateAttributesForTable(t);

      let endThings: string[] = generateTableEndParts(t);
      // let indexes: string[] = generateTableIndexes(t);

      if (attrs.length >= 1) {
        attrs[0] = `${TAB}${attrs[0]}`;
      }
      createTableLines.push([...attrs, ...endThings].join(`,\n${TAB}`));

      createTableLines.push(');');

      // createTableLines = createTableLines.concat(indexes);
    }
  }
  drops = drops.reverse();
  let all = [
    'BEGIN TRANSACTION;',
    '',
    '-- Drop Everything',
    '',
    ...drops,
    '',
    '-- Create Everything',
    ...createTableLines,
    '',
    'COMMIT;',
  ];
  let str = all.join('\n');
  return str;
}

function generateTableEndParts(t: Table) {
  let endThings: string[] = [];

  let pks: string[] = [];

  for (const a of t.Attributes) {
    if (!a.Option?.PrimaryKey) continue;
    if (!a.RefTo) {
      pks.push(cc(a.Name, 's'));
      continue;
    }

    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) continue;
      pks.push(cc(`${a.Name}_${ra.Name}`, 's'));
    }
  }

  if (pks.length > 0) {
    let pksJoined = pks.join(', ');
    let pksStr = `PRIMARY KEY ( ${pksJoined} )`;
    endThings.push(pksStr);
  }

  let uniques = t.Attributes.filter((e) => e.Option?.Unique).map((e) => e.Name);
  if (uniques.length > 0) {
    for (const e of uniques) {
      let uniquesStr = `UNIQUE ( ${cc(e, 's')} )`;
      endThings.push(uniquesStr);
    }
  }

  let refs = t.Attributes.filter((e) => e.RefTo);
  if (refs.length > 0) {
    for (const e of refs) {
      let r = e.RefTo!;
      let rPks = r.Attributes.filter((e) => e.Option?.PrimaryKey);
      for (const rPk of rPks) {
        let rStr = `FOREIGN KEY ( ${cc(e.Name, 's')}_${cc(
          rPk.Name,
          's'
        )} ) REFERENCES ${r.FN} ( ${cc(rPk.Name, 's')} ) ON DELETE CASCADE`;
        endThings.push(rStr);
      }
    }
  }

  endThings = alignKeyword(endThings, '(');
  return endThings;
}

function generateAttributesForTable(t: Table, beingReferences?: Attribute) {
  let attrs: string[] = [];
  for (const a of t.Attributes) {
    if (beingReferences) {
      if (!a.Option?.PrimaryKey) {
        continue;
      }
    }
    let name = beingReferences ? `${cc(beingReferences.Name, 's')}_${cc(a.Name, 's')}` : cc(a.Name, 's');
    let type = '';
    if ([AttrType.VARCHAR].includes(a.Type)) {
      let max = 15;
      if (!a.Validation || !a.Validation.Max) {
        console.warn(`missing max validation on "${name}"`);
      } else {
        max = a.Validation.Max;
      }
      type = [SQL_TO_TSQL_TYPE[a.Type], `(${max || '15'})`].join('');
    } else if (a.Type === AttrType.REFERENCE) {
      if (beingReferences) {
        // prevents endless recursion
        continue;
      }
      if (!a.RefTo) {
        console.warn(`invalid referenced id "${name}"`);
        continue;
      }
      let referencedAttrs = generateAttributesForTable(a.RefTo, a);
      attrs = attrs.concat(referencedAttrs);
      continue;
    } else {
      type = SQL_TO_TSQL_TYPE[a.Type];
    }

    if (beingReferences && a.Type === AttrType.SERIAL) {
      type = 'INT';
    }

    let attrLine = [`${cc(name, 's')} ${type}`];

    if (a.Option?.Default) {
      let def = a.Option.Default;
      if ([AttrType.VARCHAR, AttrType.CHAR].includes(a.Type)) {
        def = `'${def.replaceAll("'", "''")}'`;
      }
      // todo better default handling
      attrLine.push(`DEFAULT ${def}`);
    }
    if (a.Validation?.Required) {
      attrLine.push(`NOT NULL`);
    }
    attrs.push(attrLine.join(' '));
  }

  attrs = alignKeywords(attrs, Object.values(AttrType));
  return attrs;
}
