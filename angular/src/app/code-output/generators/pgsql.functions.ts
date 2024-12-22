import { TAB } from '../../constants';
import { convertCase, alignKeyword, alignKeywords } from '../../formatting';
import {
  Table,
  AttrType,
  Schema,
  Attribute,
  AttributeNameWithTable,
} from '../../structure';

export function SchemasToSqlFuncs(schemas: Schema[]): string {
  let lines: string[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      let fns = generateSqlFns(t);
      if (!fns) continue;
      lines = lines.concat(fns);
      lines.push('');
    }
  }

  lines = ['BEGIN;', '', ...lines, 'COMMIT;'];
  let str = lines.join('\n');
  return str;
}

// CREATE OR REPLACE FUNCTION increment(i integer) RETURNS integer AS $$
//         BEGIN
//                 RETURN i + 1;
//         END;
// $$ LANGUAGE plpgsql;

function generateSqlFns(t: Table) {
  let params: string[] = [];
  let fnName = convertCase(`get_${t.Name}`, 'snake');
  let selectingLines: string[] = [];
  let joinLines: string[] = [];

  for (const a of t.Attributes) {
    if (!a.Option?.PrimaryKey || a.Type === AttrType.REFERENCE) continue;
    params.push(`${convertCase(a.Name, 'camel')} ${a.Type}`);
  }

  if (params.length === 0) {
    return '';
  }

  let returnTableLines: string[] = [];

  joinLines.push(convertCase(`${t.Name}`, 'snake'));

  for (const a of t.Attributes) {
    if (a.RefTo) {
      let j1 = `LEFT JOIN ${convertCase(`${a.RefTo.Name}`, 'snake')} ON`;
      let j1ON = [];

      for (const ra of a.RefTo.Attributes) {
        if (!ra.Parent) continue;
        returnTableLines.push(
          `${convertCase(AttributeNameWithTable(ra), 'snake')} ${ra.Type}`
        );
        selectingLines.push(
          `${AttributeNameWithTable(ra)} AS ${`${convertCase(
            AttributeNameWithTable(ra),
            'snake'
          )}`}`
        );
      }
      for (const ra of a.RefTo.Attributes) {
        if (!ra.Parent) continue;
        if (!ra.Option?.PrimaryKey) continue;
        let left = `${convertCase(`${a.RefTo.Name}`, 'snake')}.${convertCase(
          `${ra.Name}`,
          'snake'
        )}`;
        j1ON.push(
          `${left} = ${convertCase(t.Name, 'snake')}.${convertCase(
            `${left}`,
            'snake'
          )}`
        );
      }
      joinLines.push(`${j1} ${j1ON.join(' AND ')}`);
      continue;
    }
    returnTableLines.push(`${convertCase(a.Name, 'camel')} ${a.Type}`);
    // selectingLines.push(
    //   `${AttributeNameWithTable(a)} AS ${`${convertCase(
    //     AttributeNameWithTable(a),
    //     'snake'
    //   )}`}`
    // );
    selectingLines.push(`${AttributeNameWithTable(a)}`);
  }

  if (t.RefBy) {
    for (const tbl of t.RefBy) {
      let added = false;

      let j1 = `LEFT JOIN ${convertCase(`${tbl.Name}`, 'snake')} ON`;
      let j1ON = [];

      for (const a of tbl.Attributes) {
        if (!a.RefTo) continue;
        if (!a.Parent) continue;
        if (a.RefTo.ID === t.ID) continue;
        added = true;
        let t2 = a.RefTo;

        let j2 = `LEFT JOIN ${convertCase(
          `${convertCase(`${t2.Name}`, 'snake')}`,
          'snake'
        )} ON`;
        let j2ON = [];

        for (const a2 of t2.Attributes) {
          if (a2.Type === AttrType.REFERENCE) continue;
          if (!a2.Option?.PrimaryKey) continue;

          let l1 = `${convertCase(`${t.Name}`, 'snake')}.${convertCase(
            `${a2.Name}`,
            'snake'
          )}`;
          let l2 = `${convertCase(`${tbl.Name}`, 'snake')}.${convertCase(
            `${a2.Name}`,
            'snake'
          )}`;

          j1ON.push(
            `${l1} = ${convertCase(a.Parent.Name, 'snake')}.${convertCase(
              `${l1}`,
              'snake'
            )}`
          );
          j2ON.push(
            `${l2} = ${convertCase(a.RefTo.Name, 'snake')}.${convertCase(
              `${l1}`,
              'snake'
            )}`
          );

          returnTableLines.push(
            `${convertCase(AttributeNameWithTable(a2), 'snake')} ${a2.Type}`
          );
          selectingLines.push(
            `${AttributeNameWithTable(a2)} AS ${`${convertCase(
              AttributeNameWithTable(a2),
              'snake'
            )}`}`
          );
        }

        if (added) {
          if (j1ON.length === 0) {
            continue;
          }
          if (j2ON.length === 0) {
            continue;
          }

          j1 += ` ${j1ON.join(' AND ')}`;
          j2 += ` ${j2ON.join(' AND ')}`;
          joinLines.push(j1);
          joinLines.push(j2);
        }
      }
      if (!added) {
        for (const a2 of tbl.Attributes) {
          if (!a2.Parent) continue;
          if (!a2.Option?.PrimaryKey) continue;
          if (a2.Type === AttrType.REFERENCE) continue;

          let left = `${convertCase(`${t.Name}`, 'snake')}.${convertCase(
            `${a2.Name}`,
            'snake'
          )}`;
          j1ON.push(
            `${left} = ${convertCase(a2.Parent.Name, 'snake')}.${convertCase(
              `${left}`,
              'snake'
            )}`
          );

          returnTableLines.push(
            `${convertCase(AttributeNameWithTable(a2), 'snake')} ${a2.Type}`
          );
          selectingLines.push(
            `${AttributeNameWithTable(a2)} AS ${`${convertCase(
              AttributeNameWithTable(a2),
              'snake'
            )}`}`
          );
        }
        joinLines.push(`${j1} ${j1ON.join(' AND ')}`);
      }
    }
  }

  joinLines = alignKeyword(joinLines, 'ON');
  joinLines = alignKeyword(joinLines, '=');
  selectingLines = alignKeyword(selectingLines, 'AS');

  let selecting = selectingLines.join(`,\n${TAB}${TAB}${TAB}`);
  let returnTable = returnTableLines.join(', ');
  let paramsStr = params.join(', ');
  let joinStr = joinLines.join(`\n${TAB}${TAB}${TAB}`);

  let q = `CREATE OR REPLACE FUNCTION ${fnName} ( ${paramsStr} ) 
    RETURNS TABLE ( ${returnTable} ) 
    AS $$ BEGIN
        SELECT 
            ${selecting}
        FROM
            ${joinStr}
    END; 
$$ LANGUAGE plpgsql;`;

  q = q.replaceAll('SERIAL', 'INT');

  return q;
}

function generateSqlFnStructAttributes(
  a: Attribute,
  recursive: boolean
): string[] {
  let lines: string[] = [];

  if (a.Type === AttrType.REFERENCE && a.RefTo && !recursive) {
    a.RefTo.Attributes;
    for (const ra of a.RefTo.Attributes) {
      if (!ra.Option?.PrimaryKey) {
        continue;
      }
      let refAttrs = generateSqlFnStructAttributes(ra, true);
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
