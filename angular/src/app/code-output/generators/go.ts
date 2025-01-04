import { groupBy, TAB } from '../../constants';
import { cc, alignKeyword } from '../../formatting';
import { Schema, Func, AppGeneratorMode, AttrType } from '../../structure';

export function SchemasToGoStructs(schemas: Schema[]): string {
  let funcs: Func[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      let func = new Func(t, AppGeneratorMode.Go);
      funcs.push(func);
    }
  }

  let lines: string[] = [];

  for (const f of funcs) {
    // Struct

    lines.push(`type ${f.title} = struct {`);
    let attrs: string[] = generateStructAttributes(f);
    lines = lines.concat(attrs);
    lines.push(`}\n`);

    // Func

    let funcAttrs: string[] = generateFuncReturnStruct(f);
    let { title, params } = generateTitleAndParams(f);

    lines.push(`func ${title} (${params}) *${f.title} {`);
    lines.push(`${TAB}return &${f.title} {`);

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
  let params = Object.entries(groupBy(relevantInputs, 'type'))
    // .sort((a, b) => a[0].localeCompare(b[0]))
    // .map((e) => {
    //   e[1] = e[1].sort((a, b) => a.label.localeCompare(b.label));
    //   return e;
    // })
    .map((e) => {
      return `${e[1].map((r) => r.label).join(', ')} ${e[0]}`;
    })
    .join(', ');

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
    attrs.push(`${TAB}${e.label} ~~${e.type} \`json:"${cc(e.label, 'sk')}"\``);
  }
  attrs = alignKeyword(attrs, '~~');
  attrs = attrs.map((e) => e.replace('~~', ''));
  attrs = alignKeyword(attrs, '`json:');
  return attrs;
}
