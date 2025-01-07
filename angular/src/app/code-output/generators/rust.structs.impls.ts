import { TAB } from '../../constants';
import { cc } from '../../formatting';
import { Schema, Func, AppGeneratorMode } from '../../structure';

export function SchemasToRustStructsImpl(schemas: Schema[]): string {
  const funcs: Func[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      const func = new Func(t, AppGeneratorMode.RustStructAndImpl);
      funcs.push(func);
    }
  }

  let lines: string[] = [];

  lines.push('// utilize chrono for date and time as needed:');
  lines.push('// use chrono::{NaiveDate, NaiveDateTime, NaiveTime, Utc};');
  lines.push('');

  for (const f of funcs) {
    const pt = cc(f.title, 'pl');

    // Struct

    lines.push(`struct ${pt} {`);
    const attrs: string[] = generateStructAttributes(f);
    lines = lines.concat(attrs);

    lines.push(`}\n`);

    // Func

    const funcAttrs: string[] = generateFuncReturnStruct(f);
    const { params } = generateParams(f);

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

  const str = lines.join('\n');
  return str;
}

function generateParams(f: Func) {
  const relevantInputs = f.outputs.map((e) => e.relatedInput).filter((e) => !!e);
  const params = relevantInputs
    .map((e) => `${e.label}: ${e.type}`)
    .join(`,\n${TAB}${TAB}`);

  return { params };
}

function generateFuncReturnStruct(f: Func) {
  const funcAttrs: string[] = [];
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
  const attrs: string[] = [];
  for (const e of f.outputs) {
    attrs.push(
      `${TAB}pub ${e.label}: ${e.relatedInput ? e.relatedInput.type : e.type},`
    );
  }
  return attrs;
}
