import { TAB } from '../../constants';
import { cc, alignKeyword, alignKeywords } from '../../formatting';
import { Table, AttrType, Schema, Attribute } from '../../structure';

export class UseI {
  iUsages: Record<string, number> = {};

  increment = (t: Table, sameSchema: boolean, t2?: [Table, Table]): void => {
    let key =
      sameSchema && !t2
        ? t.SimpleInitials
        : t2
        ? `${t2[0].SimpleInitials}${t2[1].SimpleInitials}${t.SimpleInitials}`
        : t.FNInitials;

    if (!this.iUsages[key]) {
      this.iUsages[key] = -1;
    }
    this.iUsages[key] += 1;
  };

  get = (t: Table, sameSchema: boolean, t2?: [Table, Table]): string => {
    let key =
      sameSchema && !t2
        ? t.SimpleInitials
        : t2
        ? `${t2[0].SimpleInitials}${t2[1].SimpleInitials}${t.SimpleInitials}`
        : t.FNInitials;

    return key + (this.iUsages[key] || '');
  };
}

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
  let fnName = `${cc(t.Parent.Name, 'sk')}.${cc(`get_${t.Name}`, 'sk')}`;
  let selectingLines: string[] = [];

  let useI = new UseI();
  useI.increment(t, true);

  let whereAND = [];
  for (const a of t.Attributes) {
    if (!a.Option?.PrimaryKey || a.Type === AttrType.REFERENCE) continue;
    params.push(`${cc(a.Name, 'sk')} ${a.Type}`);
    whereAND.push(
      `${useI.get(t, true)}.${cc(a.Name, 'sk')} = ${cc(a.Name, 'sk')}`
    );
  }
  let whereStr: string = whereAND.join(' AND ');

  if (params.length === 0) {
    return '';
  }

  let returnTableLines: string[] = [];

  for (const a of t.Attributes) {
    if (!a.RefTo) {
      let n = cc(`${useI.get(t, true)}_${cc(a.Name, 'sk')}`, 'sk');
      returnTableLines.push(`${n} ${a.Type}`);
      selectingLines.push(`${useI.get(t, true)}.${cc(a.Name, 'sk')} AS ${n}`);
      continue;
    }

    for (const ra of a.RefTo.Attributes) {
      let n = cc(`${useI.get(t, true)}_${cc(ra.Name, 'sk')}`, 'sk');
      returnTableLines.push(`${n} ${ra.Type}`);
      selectingLines.push(`${useI.get(t, true)}.${cc(ra.Name, 'sk')} AS ${n}`);
    }
  }

  let joinLines: string[] = GenerateJoinLines(
    t,
    returnTableLines,
    selectingLines,
    useI
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
  selectingLines: string[],
  useI: UseI
) {
  let joinLines: string[] = [];
  joinLines.push(`${t.FN} ${useI.get(t, true)}`);

  if (t.RefBy) {
    for (const tbl of t.RefBy) {
      let sameSchema = tbl.Parent.ID === t.Parent.ID;

      useI.increment(tbl, sameSchema);

      let j1 = `LEFT JOIN ${tbl.FN} ${useI.get(tbl, sameSchema)} ON`;
      let j1ON = [];

      for (const a2 of tbl.Attributes) {
        if (a2.Type === AttrType.REFERENCE && a2.RefTo) {
          let pksForJoin = a2.RefTo.Attributes.filter(
            (e) => e.Option?.PrimaryKey && e.Type !== AttrType.REFERENCE
          );
          for (const ra2 of pksForJoin) {
            if (t.ID !== ra2.Parent.ID) continue;
            j1ON.push(
              `${useI.get(tbl, sameSchema)}.${cc(
                `${a2.Name}_${ra2.Name}`,
                'sk'
              )} = ${useI.get(t, true)}.${cc(ra2.Name, 'sk')}`
            );
          }
          continue;
        }

        // let n =
        //   a2.Parent.Parent.ID === t.Parent.ID
        //     ? cc(a2.PFN, 's')
        //     : cc(a2.FN, 's');
        let n = cc(`${useI.get(tbl, sameSchema)}_${cc(a2.Name, 'sk')}`, 'sk');
        returnTableLines.push(`${n} ${a2.Type}`);
        selectingLines.push(
          `${useI.get(tbl, sameSchema)}.${cc(a2.Name, 'sk')} AS ${n}`
        );
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
        let sameSchema = t2.Parent.ID === t.Parent.ID;
        useI.increment(t2, sameSchema);

        let j2 = `LEFT JOIN ${t2.FN} ${useI.get(t2, sameSchema, [t, tbl])} ON`;
        let j2ON = [];

        for (const a2 of t2.Attributes) {
          if (a2.Type === AttrType.REFERENCE) continue;

          let n = cc(
            `${useI.get(t2, sameSchema, [t, tbl])}_${cc(a2.Name, 'sk')}`,
            'sk'
          );
          returnTableLines.push(`${n} ${a2.Type}`);
          selectingLines.push(
            `${useI.get(t2, sameSchema, [t, tbl])}.${cc(a2.Name, 'sk')} AS ${n}`
          );
        }

        for (const a2 of t2.Attributes) {
          if (a2.Type === AttrType.REFERENCE) continue;
          if (!a2.Option?.PrimaryKey) continue;

          // WHAT (post)
          // social.user_post.what_bbb_id      = social.post.id
          j2ON.push(
            `${useI.get(t2, sameSchema, [t, tbl])}.${cc(
              a2.Name,
              'sk'
            )} = ${useI.get(tbl, true)}.${cc(`${a.Name}_${a2.Name}`, 'sk')}`
          );

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
