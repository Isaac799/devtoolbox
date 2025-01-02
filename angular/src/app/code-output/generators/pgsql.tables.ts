import { TAB } from '../../constants';
import { cc, alignKeyword, alignKeywords } from '../../formatting';
import { Table, AttrType, Schema, Attribute } from '../../structure';

export function SchemasToPostgreSQL(schemas: Schema[]): string {
  let drops: string[] = [];
  let createTableLines: string[] = [];
  for (const s of schemas) {
    drops.push(`DROP SCHEMA IF EXISTS ${cc(s.Name, 'sk')};`);
    createTableLines.push('');
    createTableLines.push(`CREATE SCHEMA IF NOT EXISTS ${cc(s.Name, 'sk')};`);
    createTableLines.push('');
    for (const t of s.Tables) {
      drops.push(`DROP TABLE IF EXISTS ${t.FN};`);
      createTableLines.push(`CREATE TABLE IF NOT EXISTS ${t.FN} (`);
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
    'BEGIN;',
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
      pks.push(cc(a.Name, 'sk'));
      continue;
    }

    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) continue;
      pks.push(cc(`${a.Name}_${ra.Name}`, 'sk'));
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
      let uniquesStr = `UNIQUE ( ${cc(e, 'sk')} )`;
      endThings.push(uniquesStr);
    }
  }

  let refs = t.Attributes.filter((e) => e.RefTo);
  if (refs.length > 0) {
    for (const e of refs) {
      let r = e.RefTo!;
      let rPks = r.Attributes.filter((e) => e.Option?.PrimaryKey);
      for (const rPk of rPks) {
        let rStr = `FOREIGN KEY ( ${cc(e.Name, 'sk')}_${cc(
          rPk.Name,
          'sk'
        )} ) REFERENCES ${r.FN} ( ${cc(rPk.Name, 'sk')} ) ON DELETE CASCADE`;
        endThings.push(rStr);
      }
    }
  }

  endThings = alignKeyword(endThings, '(');
  return endThings;
}

// function generateTableIndexes(t: Table) {
//   let endThings: string[] = [];

//   let refs = t.Attributes.filter((e) => e.RefTo);
//   if (refs.length > 0) {
//     for (const e of refs) {
//       let r = e.RefTo!;
//       let rPks = r.Attributes.filter((e) => e.Option?.PrimaryKey);
//       for (const rPk of rPks) {
//         if (rPk.Option?.PrimaryKey) continue;
//         let rStr = `CREATE INDEX  ${convertCase(
//           `idx_${AttributeNameWithSchemaAndTable(rPk)}`,
//           'snake'
//         )} ON ${TableFullName(r)} ( ${convertCase(rPk.Name, 'snake')} );`;
//         endThings.push(rStr);
//       }
//     }
//   }

//   endThings = alignKeyword(endThings, 'ON');
//   return endThings;
// }

function generateAttributesForTable(t: Table, beingReferences?: Attribute) {
  let attrs: string[] = [];
  for (const a of t.Attributes) {
    if (beingReferences) {
      if (!a.Option?.PrimaryKey) {
        continue;
      }
    }
    let name = beingReferences ? `${cc(beingReferences.Name, 'sk')}_${cc(a.Name, 'sk')}` : cc(a.Name, 'sk');
    let type = '';
    if ([AttrType.VARCHAR].includes(a.Type)) {
      let max = 15;
      if (!a.Validation || !a.Validation.Max) {
        console.warn(`missing max validation on "${name}"`);
      } else {
        max = a.Validation.Max;
      }
      type = [a.Type, `(${max || '15'})`].join('');
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
      type = a.Type;
    }

    if (beingReferences && a.Type === AttrType.SERIAL) {
      type = 'INT';
    }

    let attrLine = [`${cc(name, 'sk')} ${type}`];

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
