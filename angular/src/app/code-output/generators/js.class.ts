import { TAB } from '../../constants';
import { cc, alignKeyword } from '../../formatting';
import { Schema, AppGeneratorMode, Func } from '../../structure';

export function SchemasToJsClasses(schemas: Schema[]): string {
  let funcs: Func[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      let func = new Func(t, AppGeneratorMode.TSTypesAndFns);
      funcs.push(func);
    }
  }

  let lines: string[] = [];

  for (const f of funcs) {
    let funcAttrs: string[] = generateConstructorSets(f);
    let { title, params, paramsJsDoc } = generateTitleAndParams(f);

    lines.push(`class ${title} {`);

    let attrs: string[] = generateStructAttributes(f);
    lines = lines.concat(attrs);

    lines.push('');
    lines.push(paramsJsDoc);
    lines.push(`${TAB}constructor (
${TAB}${TAB}${params}
    ) {`);

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
  let params = relevantInputs.map((e) => `${e.label}`).join(`,\n${TAB}${TAB}`);
  const title = cc(`${f.title}`, 'pl');
  let jsDocParams = relevantInputs
    .map((e) => `* @param {${e.type}} ${e.label} `)
    .join(`\n${TAB}`);
  let paramsJsDoc = `${TAB}/**
${TAB}* Create a ${title}.
${TAB}${jsDocParams}
${TAB}*/`;

  return { title, params, paramsJsDoc };
}

function generateConstructorSets(f: Func) {
  let funcAttrs: string[] = [];
  for (const o of f.outputs) {
    if (o.relatedInput === null) {
      funcAttrs.push(`${TAB}${TAB}this.${o.label} = ${o.defaultValue};`);
      continue;
    }
    funcAttrs.push(`${TAB}${TAB}this.${o.label} = ${o.relatedInput.label};`);
  }

  return funcAttrs;
}

function generateStructAttributes(f: Func) {
  let attrs: string[] = [];
  for (const e of f.outputs) {
    let paramsJsDoc = `${TAB}/**
${TAB}* @type {${e.relatedInput ? e.relatedInput.type : e.type}}
${TAB}*/`;

    attrs.push(paramsJsDoc);
    attrs.push(`${TAB}${e.label};`);
  }
  return attrs;
}
