import { TAB } from '../../constants';
import { convertCase, alignKeyword } from '../../formatting';
import {
  Table,
  AttrType,
  Schema,
  AttributeNameWithTable,
} from '../../structure';

export function SchemasToTSQLStoredProcedures(schemas: Schema[]): string {
  let lines: string[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      let fns = generateSqlFns(t);
      if (!fns) continue;
      lines = lines.concat(fns);
      lines.push('');
    }
  }

  let str = lines.join('\n');
  return str;
}

function generateSqlFns(t: Table) {
  let params: string[] = [];
  let fnName = convertCase(`get_${t.Name}`, 'snake');
  let selectingLines: string[] = [];
  let joinLines: string[] = [];

  let whereAND = [];
  for (const a of t.Attributes) {
    if (!a.Option?.PrimaryKey || a.Type === AttrType.REFERENCE) continue;
    params.push(`@${convertCase(a.Name, 'camel')} ${a.Type}`);
    whereAND.push(
      `${convertCase(t.Name, 'snake')}.${convertCase(
        a.Name,
        'snake'
      )} = @${convertCase(a.Name, 'camel')}`
    );
  }
  let whereStr: string = whereAND.join(' AND ');

  if (params.length === 0) {
    return '';
  }

  joinLines.push(convertCase(`[${t.Name}]`, 'snake'));

  for (const a of t.Attributes) {
    if (!a.RefTo) {
      selectingLines.push(`${AttributeNameWithTable(a)}`);
      continue;
    }

    let j1 = `LEFT JOIN ${convertCase(`${a.RefTo.Name}`, 'snake')} ON`;
    let j1ON = [];

    for (const ra of a.RefTo.Attributes) {
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
          selectingLines.push(
            `${AttributeNameWithTable(a2)} AS ${`${convertCase(
              AttributeNameWithTable(a2),
              'snake'
            )}`}`
          );
        }
        for (const a2 of t2.Attributes) {
          if (a2.Type === AttrType.REFERENCE) continue;
          if (!a2.Option?.PrimaryKey) continue;

          let l1 = `${convertCase(`${t.Name}`, 'snake')}.${convertCase(
            `${a2.Name}`,
            'snake'
          )}`;
          let l2 = `${convertCase(`${t2.Name}`, 'snake')}.${convertCase(
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
            `${l2} = ${convertCase(tbl.Name, 'snake')}.${convertCase(
              `${l2}`,
              'snake'
            )}`
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
        }
        for (const a2 of tbl.Attributes) {
          if (!a2.Parent) continue;
          if (a2.Type === AttrType.REFERENCE) continue;

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

  let selecting = selectingLines.join(`,\n${TAB}${TAB}`);
  let paramsStr = params.join(', ');
  let joinStr = joinLines.join(`\n${TAB}${TAB}`);

  let q = `CREATE PROCEDURE ${fnName} ( ${paramsStr} ) 
    AS BEGIN
    SET NOCOUNT ON;
     
    SELECT 
        ${selecting}
    FROM
        ${joinStr}
    WHERE
        ${whereStr};
    END; 
GO;`;

  q = q.replaceAll('SERIAL', 'INT');

  return q;
}
