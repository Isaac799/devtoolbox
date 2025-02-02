import {Injectable} from '@angular/core'
import {AppGeneratorMode, Func, Schema} from '../../structure'
import {TAB} from '../../constants'
import {alignKeyword, cc} from '../../formatting'

@Injectable({
    providedIn: 'root'
})
export class LanguageCsService {
    static ToClasses(schemas: Schema[]): string {
        const funcs: Func[] = []
        for (const s of schemas) {
            for (const t of s.Tables) {
                const func = new Func(t, AppGeneratorMode.CSClasses)
                funcs.push(func)
            }
        }

        let lines: string[] = []

        lines.push('using System;')
        lines.push('using System.Collections.Generic;')
        lines.push('')

        for (const f of funcs) {
            let funcAttrs: string[] = LanguageCsService.generateConstructorSets(f)
            const {title, params} = LanguageCsService.generateTitleAndParams(f)

            lines.push(`class ${title} {`)

            const attrs: string[] = LanguageCsService.generateStructAttributes(f)
            lines = lines.concat(attrs)

            lines.push(`\n${TAB}public ${title} (
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

    private static generateTitleAndParams(f: Func) {
        const relevantInputs = f.outputs.map(e => e.relatedInput).filter(e => !!e)
        const params = relevantInputs.map(e => `${e.type} ${e.label}`).join(`,\n${TAB}${TAB}`)

        const title = cc(`${f.title}`, 'pl')
        return {title, params}
    }

    private static generateConstructorSets(f: Func) {
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

    private static generateStructAttributes(f: Func) {
        const attrs: string[] = []
        for (const e of f.outputs) {
            attrs.push(`${TAB}public ${e.relatedInput ? e.relatedInput.type : e.type} ${e.label} { get; set; }`)
        }
        return attrs
    }
}
