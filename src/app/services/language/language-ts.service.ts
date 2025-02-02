import {Injectable} from '@angular/core'
import {TAB} from '../../constants'
import {alignKeyword, cc} from '../../formatting'
import {Func, Schema, AppGeneratorMode, FuncIn} from '../../structure'

@Injectable({
    providedIn: 'root'
})
export class LanguageTsService {
    static ToClasses(schemas: Schema[]): string {
        const funcs: Func[] = []
        for (const s of schemas) {
            for (const t of s.Tables) {
                const func = new Func(t, AppGeneratorMode.TSTypesAndFns)
                funcs.push(func)
            }
        }

        let lines: string[] = []

        for (const f of funcs) {
            let funcAttrs: string[] = LanguageTsService.generateConstructorSets(f)
            const {title, params} = LanguageTsService.generateTitleAndParams(f)

            lines.push(`class ${title} {`)

            const attrs: string[] = LanguageTsService.generateStructAttributes(f)
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

    private static generateTitleAndParams(f: Func) {
        const relevantInputs = f.outputs.map(e => e.relatedInput).filter(e => !!e)
        const params = relevantInputs.map(e => `${e.label}: ${e.type}`).join(`,\n${TAB}${TAB}`)

        const title = cc(`${f.title}`, 'pl')
        return {title, params}
    }

    private static generateConstructorSets(f: Func) {
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

    private static generateStructAttributes(f: Func) {
        const attrs: string[] = []
        for (const e of f.outputs) {
            attrs.push(`${TAB}${e.label}: ${e.relatedInput ? e.relatedInput.type : e.type};`)
        }
        return attrs
    }

    static ToFunctions(schemas: Schema[]): string {
        const funcs: Func[] = []
        for (const s of schemas) {
            for (const t of s.Tables) {
                const func = new Func(t, AppGeneratorMode.TSTypesAndFns)
                funcs.push(func)
            }
        }

        let lines: string[] = []

        for (const f of funcs) {
            // Struct

            lines.push(`type ${f.title} = {`)
            const attrs: string[] = LanguageTsService.generateStructAttributes2(f)
            lines = lines.concat(attrs)
            lines.push(`}\n`)

            // Func

            let funcAttrs: string[] = LanguageTsService.generateFuncReturnStruct2(f)
            const {title, params} = LanguageTsService.generateTitleAndParams2(f)

            lines.push(`function ${title} (
  ${TAB}${params}
  ): ${f.title} {`)
            lines.push(`${TAB}return {`)

            funcAttrs = alignKeyword(funcAttrs, ' :')
            lines = lines.concat(funcAttrs)

            lines.push(`${TAB}}`)
            lines.push(`}\n`)
        }

        const str = lines.join('\n')
        return str
    }

    private static generateTitleAndParams2(f: Func) {
        const relevantInputs = f.outputs.map(e => e.relatedInput).filter(e => !!e)
        const params = relevantInputs.map(e => `${e.label}: ${e.type}`).join(`,\n${TAB}`)

        const title = cc(`New_${f.title}`, 'pl')
        return {title, params}
    }

    private static generateFuncReturnStruct2(f: Func) {
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

    private static generateStructAttributes2(f: Func) {
        let attrs: string[] = []
        for (const e of f.outputs) {
            attrs.push(`${TAB}${e.label}: ${e.relatedInput ? e.relatedInput.type : e.type},`)
        }
        attrs = alignKeyword(attrs, ':')
        return attrs
    }

    static ToAngularFormControls(schemas: Schema[]): string {
        const funcs: Func[] = []
        for (const s of schemas) {
            for (const t of s.Tables) {
                const func = new Func(t, AppGeneratorMode.TSTypesAndFns)
                funcs.push(func)
            }
        }

        let lines: string[] = []

        for (const f of funcs) {
            lines.push(`${f.title} = new FormGroup({`)
            const controls: string[] = []
            for (const e of f.outputs) {
                const t = e.relatedInput ? e.relatedInput.type : e.type
                const v = e.defaultValue || null
                const validators = `[${LanguageTsService.GenerateValidatorsForAttribute(e.relatedInput)}]`
                const formControl = `${TAB}${e.label}: new FormControl<${t}>(${v} , ${validators})`
                controls.push(formControl)
            }
            lines = lines.concat(controls.join(`,\n`))
            lines.push(`})\n`)
        }

        const str = lines.join('\n')
        return str
    }

    private static GenerateValidatorsForAttribute(input: FuncIn | null) {
        if (!input) {
            return ''
        }

        const v = input.validation

        if (!v) {
            return ''
        }

        const validators: string[] = []

        if (v.Required) {
            validators.push('Validators.required')
        }
        if (v.Min != undefined) {
            if (input.isNumerical) {
                validators.push(`Validators.min(${v.Min})`)
            } else {
                validators.push(`Validators.minLength(${v.Min})`)
            }
        }
        if (v.Max != undefined) {
            if (input.isNumerical) {
                validators.push(`Validators.max(${v.Max})`)
            } else {
                validators.push(`Validators.maxLength(${v.Max})`)
            }
        }

        const validatorsStr = validators.join(', ')
        return validatorsStr
    }
}
