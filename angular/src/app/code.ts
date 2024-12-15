import { alignKeyword, alignKeywords } from './formatting';
import { AttrType, Schema } from './structure';

const TAB = '    ';

export const schemasToPostgreSQL = (schemas: Schema[]) => {
  let drops: string[] = [];
  let createTableLines: string[] = [];
  for (const s of schemas) {
    drops.push(`DROP SCHEMA IF EXISTS ${s.Name};`);
    createTableLines.push(`CREATE SCHEMA IF NOT EXISTS ${s.Name};`);
    for (const t of s.Tables) {
      let attrs: string[] = [];
      createTableLines.push(`CREATE TABLE IF NOT EXISTS ${t.Name} (`);
      drops.push(`DROP TABLE IF EXISTS ${t.Name};`);
      for (const a of t.Attributes) {
        let type = '';
        if ([AttrType.VARCHAR].includes(a.Type)) {
          let max = 15;
          if (!a.Validation || !a.Validation.Max) {
            console.warn(`missing max validation on "${a.Name}"`);
          } else {
            max = a.Validation.Max;
          }
          type = [a.Type, `(${max || '15'})`].join('');
        } else {
          type = a.Type;
        }

        let attrLine = [`${a.Name} ${type}`];
        if (a.Options?.Default) {
          // todo better default handling
          attrLine.push(`DEFAULT ${a.Options?.Default}`);
        }
        if (a.Validation?.Required) {
          attrLine.push(`NOT NULL`);
        }
        attrs.push(attrLine.join(' '));
      }

      attrs = alignKeywords(attrs, Object.values(AttrType));

      let endThings: string[] = [];

      let pks = t.Attributes.filter((e) => e.Options?.PrimaryKey).map(
        (e) => e.Name
      );
      let pksStr = `PRIMARY KEY ( ${pks.join(', ')} )`;
      endThings.push(pksStr);

      let uniques = t.Attributes.filter((e) => e.Options?.Unique).map(
        (e) => e.Name
      );
      for (const e of uniques) {
        let uniquesStr = `UNIQUE ( ${e} )`;
        endThings.push(uniquesStr);
      }
      endThings = alignKeyword(endThings, '(');
      // let uniquesStr = `UNIQUE ( ${uniques.join(', ')} )`;

      attrs[0] = `${TAB}${attrs[0]}`;
      createTableLines.push([...attrs, ...endThings].join(`,\n${TAB}`));

      createTableLines.push(');');
    }
  }
  drops = drops.reverse();
  let all = ['BEGIN;', '', ...drops, '', ...createTableLines, '', 'COMMIT;'];
  let str = all.join('\n');
  return str;
};

export const schemasToGoStructs = (schemas: Schema[]) => {
  let lines: string[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      for (const a of t.Attributes) {
      }
    }
  }
  let str = lines.join('\n');
  return str;
};
