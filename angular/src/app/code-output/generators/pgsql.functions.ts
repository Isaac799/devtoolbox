import { TAB } from '../../constants';
import { cc, alignKeyword, alignKeywords } from '../../formatting';
import { Table, AttrType, Schema, Attribute } from '../../structure';

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

  let str = lines.join('\n');
  return str;
}

// CREATE OR REPLACE FUNCTION increment(i integer) RETURNS integer AS $$
//         BEGIN
//                 RETURN i + 1;
//         END;
// $$ LANGUAGE plpgsql;

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
    params.push(`${cc(a.Name, 's')} ${a.Type}`);
    whereAND.push(`${t.FN}.${cc(a.Name, 's')} = ${cc(a.Name, 's')}`);
  }
  let whereStr: string = whereAND.join(' AND ');

  if (params.length === 0) {
    return '';
  }

  let returnTableLines: string[] = [];

  for (const a of t.Attributes) {
    if (!a.RefTo) {
      let n = cc(a.FN, 's');
      returnTableLines.push(`${n} ${a.Type}`);
      selectingLines.push(`${a.FN} AS ${n}`);
      continue;
    }

    for (const ra of a.RefTo.Attributes) {
      let n = cc(a.FN, 's');
      returnTableLines.push(`${n} ${ra.Type}`);
      selectingLines.push(`${ra.FN} AS ${n}`);
    }
  }

  let joinLines: string[] = GenerateJoinLines(
    t,
    returnTableLines,
    selectingLines
  );

  joinLines = alignKeyword(joinLines, 'ON');
  joinLines = alignKeyword(joinLines, '=');
  selectingLines = alignKeyword(selectingLines, 'AS');

  let selecting = selectingLines.join(`,\n${TAB}${TAB}`);
  let returnTable = returnTableLines.join(`,\n${TAB}${TAB}`);
  let paramsStr = params.join(', ');
  let joinStr = joinLines.join(`\n${TAB}${TAB}`);

  let q = `CREATE OR REPLACE FUNCTION ${fnName} ( ${paramsStr} ) 
    RETURNS TABLE ( 
        ${returnTable}
    ) AS $$ BEGIN RETURN QUERY
    SELECT 
        ${selecting}
    FROM
        ${joinStr}
    WHERE
        ${whereStr};
    END; 
$$ LANGUAGE plpgsql;`;

  q = q.replaceAll('SERIAL', 'INT');

  return q;
}

export function GenerateJoinLines(
  t: Table,
  returnTableLines: string[],
  selectingLines: string[]
) {
  let joinLines: string[] = [];
  joinLines.push(t.FN);

  if (t.RefBy) {
    for (const tbl of t.RefBy) {
      let j1 = `LEFT JOIN ${tbl.FN} ON`;
      let j1ON = [];

      for (const a2 of tbl.Attributes) {
        if (a2.Type === AttrType.REFERENCE && a2.RefTo) {
          let pksForJoin = a2.RefTo.Attributes.filter(
            (e) => e.Option?.PrimaryKey && e.Type !== AttrType.REFERENCE
          );
          for (const ra2 of pksForJoin) {
            if (t.ID !== ra2.Parent.ID) continue;
            j1ON.push(
              `${tbl.FN}.${cc(`${a2.Name}_${ra2.Name}`, 's')} = ${ra2.FN}`
            );
          }
          continue;
        }

        // let n =
        //   a2.Parent.Parent.ID === t.Parent.ID
        //     ? cc(a2.PFN, 's')
        //     : cc(a2.FN, 's');
        let n = cc(a2.FN, 's');
        returnTableLines.push(`${n} ${a2.Type}`);
        selectingLines.push(`${a2.FN} AS ${n}`);
      }

      if (j1ON.length > 0) {
        joinLines.push(`${j1} ${j1ON.join('  !!AND ')}`);
      } else {
        console.log('__');
        console.log('missing something\nj1 :>> ', j1);
        console.log('tbl.Attributes :>> ', tbl.Attributes);
        console.log(' ^ ^ ABOVE ^ ^ ');
      }

      for (const a of tbl.Attributes) {
        if (!a.RefTo) continue;
        if (a.RefTo.ID === t.ID) continue;

        let t2 = a.RefTo;

        let j2 = `LEFT JOIN ${t2.FN} ON`;
        let j2ON = [];

        for (const a2 of t2.Attributes) {
          if (a2.Type === AttrType.REFERENCE) continue;

          let n = cc(a2.FN, 's');
          returnTableLines.push(`${n} ${a2.Type}`);
          selectingLines.push(`${a2.FN} AS ${n}`);
        }

        for (const a2 of t2.Attributes) {
          if (a2.Type === AttrType.REFERENCE) continue;
          if (!a2.Option?.PrimaryKey) continue;

          // WHAT (post)
          // social.user_post.what_bbb_id      = social.post.id
          j2ON.push(`${tbl.FN}.${cc(`${a.Name}_${a2.Name}`, 's')} = ${a2.FN}`);

          // j2ON.push(`${a2.FN} = ${l1} -- HI`);
        }

        if (j2ON.length > 0) {
          j2 += ` ${j2ON.join(' AND ')}`;
          joinLines.push(j2);
        }
      }
    }
  }
  return joinLines;
}
