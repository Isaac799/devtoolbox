import {TAB} from '../../constants'
import {cc, alignKeyword} from '../../formatting'
import {Schema, AppGeneratorMode, Func} from '../../structure'

export function SchemasToJsClasses(schemas: Schema[]): string {
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
        const {title, params, paramsJsDoc} = generateTitleAndParams(f)

        lines.push(`class ${title} {`)

        const attrs: string[] = generateStructAttributes(f)
        lines = lines.concat(attrs)

        lines.push('')
        lines.push(paramsJsDoc)
        lines.push(`${TAB}constructor (
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
    const params = relevantInputs.map(e => `${e.label}`).join(`,\n${TAB}${TAB}`)
    const title = cc(`${f.title}`, 'pl')
    const jsDocParams = relevantInputs.map(e => `* @param {${e.type}} ${e.label} `).join(`\n${TAB}`)
    const paramsJsDoc = `${TAB}/**
${TAB}* Create a ${title}.
${TAB}${jsDocParams}
${TAB}*/`

    return {title, params, paramsJsDoc}
}

function generateConstructorSets(f: Func) {
    const funcAttrs: string[] = []
    for (const o of f.outputs) {
        if (o.relatedInput === null) {
            funcAttrs.push(`${TAB}${TAB}this.${o.label} = ${o.defaultValue};`)
            continue
        }
        funcAttrs.push(`${TAB}${TAB}this.${o.label} = ${o.relatedInput.label};`)
    }

    return funcAttrs
}

function generateStructAttributes(f: Func) {
    const attrs: string[] = []
    for (const e of f.outputs) {
        const paramsJsDoc = `${TAB}/**
${TAB}* @type {${e.relatedInput ? e.relatedInput.type : e.type}}
${TAB}*/`

        attrs.push(paramsJsDoc)
        attrs.push(`${TAB}${e.label};`)
    }
    return attrs
}
