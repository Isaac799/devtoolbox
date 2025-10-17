import {Injectable} from '@angular/core'
import {AppGeneratorMode, Func, Schema} from '../../structure'
import {TAB} from '../../constants'
import {cc} from '../../formatting'

@Injectable({
    providedIn: 'root'
})
export class LanguageRustService {
    static ToStructs(schemas: Schema[]): string {
        const funcs: Func[] = []
        for (const s of schemas) {
            for (const t of s.Tables) {
                const func = new Func(t, AppGeneratorMode.RustStructAndImpl)
                funcs.push(func)
            }
        }

        let lines: string[] = []

        lines.push('// utilize chrono for date and time as needed:')
        lines.push('// use chrono::{NaiveDate, NaiveDateTime, NaiveTime, Utc};')
        lines.push('')

        for (const f of funcs) {
            const pt = cc(f.title, 'pl')

            // Struct

            lines.push(`struct ${pt} {`)
            const attrs: string[] = LanguageRustService.generateStructAttributes(f)
            lines = lines.concat(attrs)

            lines.push(`}\n`)

            // Func

            const funcAttrs: string[] = LanguageRustService.generateFuncReturnStruct(f)
            const {params} = LanguageRustService.generateParams(f)

            lines.push(`impl ${pt} {`)
            lines.push(`${TAB}pub fn new (
${TAB}${TAB}${params}
${TAB}) -> Self {`)
            lines.push(`${TAB}${TAB}${pt} {`)

            lines = lines.concat(funcAttrs)

            lines.push(`${TAB}${TAB}}`)
            lines.push(`${TAB}}`)
            lines.push(`}\n`)
        }

        const str = lines.join('\n')
        return str
    }

    private static generateParams(f: Func) {
        const relevantInputs = f.outputs.map(e => e.relatedInput).filter(e => !!e)
        const params = relevantInputs.map(e => `${e.label}: ${e.type}`).join(`,\n${TAB}${TAB}`)

        return {params}
    }

    private static generateFuncReturnStruct(f: Func) {
        const funcAttrs: string[] = []
        for (const o of f.outputs) {
            if (o.relatedInput === null) {
                funcAttrs.push(`${TAB}${TAB}${TAB}${o.label}: ${o.defaultValue},`)
                continue
            }
            funcAttrs.push(`${TAB}${TAB}${TAB}${o.label}: ${o.relatedInput.label},`)
        }

        return funcAttrs
    }

    private static generateStructAttributes(f: Func) {
        const attrs: string[] = []
        for (const e of f.outputs) {
            attrs.push(`${TAB}pub ${e.label}: ${e.relatedInput ? e.relatedInput.type : e.type},`)
        }
        return attrs
    }
}
