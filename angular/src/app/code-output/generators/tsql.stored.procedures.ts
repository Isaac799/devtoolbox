import { SQL_TO_TSQL_TYPE, TAB } from '../../constants';
import { cc, alignKeyword } from '../../formatting';
import { Table, AttrType, Schema } from '../../structure';
import { GenerateJoinLines } from './pgsql.functions';

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
  if (!t.Parent) {
    return '';
  }

  let params: string[] = [];
  let fnName = `${cc(t.Parent.Name, 's')}.${cc(`get_${t.Name}`, 's')}`;
  let selectingLines: string[] = [];

  let whereAND = [];
  for (const a of t.Attributes) {
    if (!a.Option?.PrimaryKey || a.Type === AttrType.REFERENCE) continue;
    let type = SQL_TO_TSQL_TYPE[a.Type];

    if (a.Type === AttrType.SERIAL) {
      type = SQL_TO_TSQL_TYPE[AttrType.INT];
    }

    params.push(`@${cc(a.FN, 's')} ${type}`);
    whereAND.push(`${t.FN}.${cc(a.Name, 's')} = @${cc(a.FN, 's')}`);
  }
  let whereStr: string = whereAND.join(' AND ');

  if (params.length === 0) {
    return '';
  }

  for (const a of t.Attributes) {
    if (!a.RefTo) {
      let n = cc(a.FN, 's');
      selectingLines.push(`${a.FN} AS ${n}`);
      continue;
    }

    for (const ra of a.RefTo.Attributes) {
      let n = cc(a.FN, 's');
      selectingLines.push(`${ra.FN} AS ${n}`);
    }
  }

  let joinLines: string[] = GenerateJoinLines(t, [], selectingLines);

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
