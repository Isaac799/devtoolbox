import { TAB } from '../../constants';
import { cc, alignKeyword } from '../../formatting';
import { Schema, AppGeneratorMode, Func } from '../../structure';

export function SchemasToTsTypesAndFns(schemas: Schema[]): string {
  let funcs: Func[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      let func = new Func(t, AppGeneratorMode.TSTypesAndFns);
      funcs.push(func);
    }
  }

  let lines: string[] = [];

  for (const f of funcs) {
    // Struct

    lines.push(`type ${f.title} = {`);
    let attrs: string[] = generateStructAttributes(f);
    lines = lines.concat(attrs);
    lines.push(`}\n`);

    // Func

    let funcAttrs: string[] = generateFuncReturnStruct(f);
    let { title, params } = generateTitleAndParams(f);

    lines.push(`function ${title} (${params}): ${f.title} {`);
    lines.push(`${TAB}return {`);

    funcAttrs = alignKeyword(funcAttrs, ' :');
    lines = lines.concat(funcAttrs);

    lines.push(`${TAB}}`);
    lines.push(`}\n`);
  }

  let str = lines.join('\n');
  return str;
}

function generateTitleAndParams(f: Func) {
  let relevantInputs = f.outputs.map((e) => e.relatedInput).filter((e) => !!e);
  let params = relevantInputs.map((e) => `${e.label}: ${e.type}`).join(', ');

  const title = cc(`New_${f.title}`, 'pl');
  return { title, params };
}

function generateFuncReturnStruct(f: Func) {
  let funcAttrs: string[] = [];
  for (const o of f.outputs) {
    if (o.relatedInput === null) {
      funcAttrs.push(`${TAB}${TAB}${o.label} : ${o.defaultValue},`);
      continue;
    }
    funcAttrs.push(`${TAB}${TAB}${o.label} : ${o.relatedInput.label},`);
  }

  return funcAttrs;
}

function generateStructAttributes(f: Func) {
  let attrs: string[] = [];
  for (const e of f.outputs) {
    attrs.push(
      `${TAB}${e.label}: ${e.relatedInput ? e.relatedInput.type : e.type},`
    );
  }
  attrs = alignKeyword(attrs, ':');
  return attrs;
}
