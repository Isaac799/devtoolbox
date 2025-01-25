import {TAB} from '../../constants'
import {cc, alignKeyword} from '../../formatting'
import {Schema, AppGeneratorMode, Func} from '../../structure'

export function SchemasToTsClasses(schemas: Schema[]): string {
    const funcs: Func[] = []
    for (const s of schemas) {
        for (const t of s.Tables) {
            const func = new Func(t, AppGeneratorMode.TSTypesAndFns)
            funcs.push(func)
        }
    }

    let lines: string[] = []

    for (const f of funcs) {
        let funcAttrs: string[] = generateConstructorSets(f)
        const {title, params} = generateTitleAndParams(f)

        lines.push(`class ${title} {`)

        const attrs: string[] = generateStructAttributes(f)
        lines = lines.concat(attrs)

        lines.push(`\n${TAB}constructor (
${TAB}${TAB}${params}
    ) {`)

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
    const params = relevantInputs.map(e => `${e.label}: ${e.type}`).join(`,\n${TAB}${TAB}`)

    const title = cc(`${f.title}`, 'pl')
    return {title, params}
}

function generateConstructorSets(f: Func) {
    const funcAttrs: string[] = []
    for (const o of f.outputs) {
        if (o.relatedInput === null) {
            funcAttrs.push(`${TAB}${TAB}this.${o.label} = ${o.defaultValue},`)
            continue
        }
        funcAttrs.push(`${TAB}${TAB}this.${o.label} = ${o.relatedInput.label},`)
    }

    return funcAttrs
}

function generateStructAttributes(f: Func) {
    const attrs: string[] = []
    for (const e of f.outputs) {
        attrs.push(`${TAB}${e.label}: ${e.relatedInput ? e.relatedInput.type : e.type};`)
    }
    return attrs
}
