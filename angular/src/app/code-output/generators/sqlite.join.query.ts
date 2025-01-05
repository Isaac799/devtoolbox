import { TAB } from '../../constants';
import { cc, alignKeyword } from '../../formatting';
import { Table, AttrType, Schema, SQL_TO_TSQL_TYPE } from '../../structure';
import { GenerateJoinLines, UseI } from './pgsql.functions';

export function SchemasToSQLiteJoinQuery(schemas: Schema[]): string {
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

function generateSqlFns(t: Table): string {
  if (!t.Parent) {
    return '';
  }

  let selectingLines: string[] = [];

  let whereAND = [];

  let useI = new UseI();
  useI.increment(t);

  let i = 0;

  for (const a of t.Attributes) {
    if (!a.Option?.PrimaryKey || a.Type === AttrType.REFERENCE) continue;
    i += 1;
    whereAND.push(`${useI.get(t)}.${cc(a.Name, 'sk')} = ${cc(a.FN, 'up')}`);
  }

  if (i === 0) {
    return '';
  }

  let whereStr: string = whereAND.join(' AND ');

  for (const a of t.Attributes) {
    if (!a.RefTo) {
      let n = cc(a.FN, 'sk');
      selectingLines.push(`${useI.get(t)}.${cc(a.Name, 'sk')} AS ${n}`);
      continue;
    }

    for (const ra of a.RefTo.Attributes) {
      let n = cc(a.FN, 'sk');
      selectingLines.push(`${useI.get(t)}.${cc(ra.Name, 'sk')} AS ${n}`);
    }
  }

  let joinLines: string[] = GenerateJoinLines(
    t,
    [],
    selectingLines,
    useI,
    true
  );

  joinLines = alignKeyword(joinLines, 'ON');
  joinLines = alignKeyword(joinLines, '=');
  selectingLines = alignKeyword(selectingLines, 'AS');

  let selecting = selectingLines.join(`,\n${TAB}`);
  let joinStr = joinLines.join(`\n${TAB}`);

  let q = `SELECT 
    ${selecting}
FROM
    ${joinStr}
WHERE
    ${whereStr}; -- replace with desired identifiers`;

  return q;
}
