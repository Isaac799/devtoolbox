import {groupBy, TAB} from '../../constants'
import {cc, alignKeyword} from '../../formatting'
import {Schema, Func, AppGeneratorMode} from '../../structure'

export function SchemasToGoStructs(schemas: Schema[]): string {
    const funcs: Func[] = []
    for (const s of schemas) {
        for (const t of s.Tables) {
            const func = new Func(t, AppGeneratorMode.GoStructsAndFns)
            funcs.push(func)
        }
    }

    let lines: string[] = []

    for (const f of funcs) {
        // Struct

        lines.push(`type ${f.title} = struct {`)
        const attrs: string[] = generateStructAttributes(f)
        lines = lines.concat(attrs)
        lines.push(`}\n`)

        // Func

        let funcAttrs: string[] = generateFuncReturnStruct(f)
        const {title, params} = generateTitleAndParams(f)

        lines.push(`func ${title} (${params}) *${f.title} {`)
        lines.push(`${TAB}return &${f.title} {`)

        funcAttrs = alignKeyword(funcAttrs, ' :')
        lines = lines.concat(funcAttrs)

        lines.push(`${TAB}}`)
        lines.push(`}\n`)
    }

    const str = lines.join('\n')
    return str
}

function generateTitleAndParams(f: Func) {
    const relevantInputs = f.outputs.map(e => e.relatedInput).filter(e => !!e)
    const params = Object.entries(groupBy(relevantInputs, 'type'))
        // .sort((a, b) => a[0].localeCompare(b[0]))
        // .map((e) => {
        //   e[1] = e[1].sort((a, b) => a.label.localeCompare(b.label));
        //   return e;
        // })
        .map(e => {
            return `${e[1].map(r => r.label).join(', ')} ${e[0]}`
        })
        .join(', ')

    const title = cc(`New_${f.title}`, 'pl')
    return {title, params}
}

function generateFuncReturnStruct(f: Func) {
    const funcAttrs: string[] = []
    for (const o of f.outputs) {
        if (o.relatedInput === null) {
            funcAttrs.push(`${TAB}${TAB}${o.label} : ${o.defaultValue},`)
            continue
        }
        funcAttrs.push(`${TAB}${TAB}${o.label} : ${o.relatedInput.label},`)
    }

    return funcAttrs
}

function generateStructAttributes(f: Func) {
    let attrs: string[] = []
    for (const e of f.outputs) {
        attrs.push(`${TAB}${e.label} ~~${e.relatedInput ? e.relatedInput.type : e.type} \`json:"${cc(e.label, 'sk')}"\``)
    }
    attrs = alignKeyword(attrs, '~~')
    attrs = attrs.map(e => e.replace('~~', ''))
    attrs = alignKeyword(attrs, '`json:')
    return attrs
}
