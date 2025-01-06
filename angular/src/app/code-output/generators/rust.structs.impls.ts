import { groupBy, TAB } from '../../constants';
import { cc } from '../../formatting';
import { Schema, Func, AppGeneratorMode } from '../../structure';

export function SchemasToRustStructsImpl(schemas: Schema[]): string {
  let funcs: Func[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      let func = new Func(t, AppGeneratorMode.RustStructAndImpl);
      funcs.push(func);
    }
  }

  let lines: string[] = [];

  lines.push('// utilize chrono for date and time as needed:');
  lines.push('// use chrono::{NaiveDate, NaiveDateTime, NaiveTime, Utc};');
  lines.push('');

  for (const f of funcs) {
    let pt = cc(f.title, 'pl');

    // Struct

    lines.push(`struct ${pt} {`);
    let attrs: string[] = generateStructAttributes(f);
    lines = lines.concat(attrs);

    lines.push(`}\n`);

    // Func

    let funcAttrs: string[] = generateFuncReturnStruct(f);
    let { params } = generateParams(f);

    lines.push(`impl ${pt} {`);
    lines.push(`${TAB}pub fn new (
${TAB}${TAB}${params}
${TAB}) -> Self {`);
    lines.push(`${TAB}${TAB}${pt} {`);

    lines = lines.concat(funcAttrs);

    lines.push(`${TAB}${TAB}}`);
    lines.push(`${TAB}}`);
    lines.push(`}\n`);
  }

  let str = lines.join('\n');
  return str;
}

function generateParams(f: Func) {
  let relevantInputs = f.outputs.map((e) => e.relatedInput).filter((e) => !!e);
  let params = relevantInputs
    .map((e) => `${e.label}: ${e.type}`)
    .join(`,\n${TAB}${TAB}`);

  return { params };
}

function generateFuncReturnStruct(f: Func) {
  let funcAttrs: string[] = [];
  for (const o of f.outputs) {
    if (o.relatedInput === null) {
      funcAttrs.push(`${TAB}${TAB}${TAB}${o.label}: ${o.defaultValue},`);
      continue;
    }
    funcAttrs.push(`${TAB}${TAB}${TAB}${o.label}: ${o.relatedInput.label},`);
  }

  return funcAttrs;
}

function generateStructAttributes(f: Func) {
  let attrs: string[] = [];
  for (const e of f.outputs) {
    attrs.push(
      `${TAB}pub ${e.label}: ${e.relatedInput ? e.relatedInput.type : e.type},`
    );
  }
  return attrs;
}
