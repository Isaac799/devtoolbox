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

            const validationThrow = LanguageTsService.generateValidateThrow(f)
            lines = lines.concat(validationThrow)

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

    private static generateValidateThrow(f: Func) {
        let lines: string[] = []
        if (!f.hasValidation()) {
            return []
        }

        for (const o of f.inputs) {
            if (!o.raw.attribute.Validation) continue
            const v = o.raw.attribute.Validation
            const l: string[] = []
            if (o.raw.attribute.isStr()) {
                if (v.Min !== undefined) {
                    l.push(`if ${o.label}.length < ${v.Min} {`)
                    l.push(`${TAB}throw new Error("'${cc(o.label, 'nc')}' must be at least ${v.Min} characters")`)
                    l.push(`}`)
                }
                if (v.Max !== undefined) {
                    l.push(`if ${o.label}.length > ${v.Max} {`)
                    l.push(`${TAB}throw new Error("'${cc(o.label, 'nc')}' must be at most ${v.Max} characters")`)
                    l.push(`}`)
                }
            } else {
                if (v.Min !== undefined) {
                    l.push(`if ${o.label} < ${v.Min} {`)
                    l.push(`${TAB}throw new Error("'${cc(o.label, 'nc')}' must be at least ${v.Min}")`)
                    l.push(`}`)
                }
                if (v.Max !== undefined) {
                    l.push(`if ${o.label} > ${v.Max} {`)
                    l.push(`${TAB}throw new Error("'${cc(o.label, 'nc')}' must be at most ${v.Max}")`)
                    l.push(`}`)
                }
            }
            lines.push(`${TAB}${TAB}` + l.join(`\n${TAB}${TAB}`))
        }

        lines = lines.filter(e => e.trim().length > 0)

        return lines
    }

    private static generateValidateFn(f: Func) {
        let lines: string[] = []
        if (!f.hasValidation()) {
            return []
        }

        const fl = cc(f.title, 'cm')
        lines.push(`function Validate${f.title} (${fl}: ${f.title}): Error | null {`)
        for (const o of f.outputs) {
            if (!o.raw.attribute.Validation) continue
            const v = o.raw.attribute.Validation
            const l: string[] = []
            if (o.raw.attribute.isStr()) {
                if (v.Min !== undefined) {
                    l.push(`if ${fl}.${o.label}.length < ${v.Min} {`)
                    l.push(`${TAB}return new Error("'${cc(o.label, 'nc')}' must be at least ${v.Min} characters")`)
                    l.push(`}`)
                }
                if (v.Max !== undefined) {
                    l.push(`if ${fl}.${o.label}.length > ${v.Max} {`)
                    l.push(`${TAB}return new Error("'${cc(o.label, 'nc')}' must be at most ${v.Max} characters")`)
                    l.push(`}`)
                }
            } else {
                if (v.Min !== undefined) {
                    l.push(`if ${fl}.${o.label} < ${v.Min} {`)
                    l.push(`${TAB}return new Error("'${cc(o.label, 'nc')}' must be at least ${v.Min}")`)
                    l.push(`}`)
                }
                if (v.Max !== undefined) {
                    l.push(`if ${fl}.${o.label} > ${v.Max} {`)
                    l.push(`${TAB}return new Error("'${cc(o.label, 'nc')}' must be at most ${v.Max}")`)
                    l.push(`}`)
                }
            }
            lines.push(`${TAB}` + l.join(`\n${TAB}`))
        }
        lines.push(`${TAB}return null`)
        lines.push(`}`)

        lines = lines.filter(e => e.trim().length > 0)

        return lines
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

            const validateFn: string[] = LanguageTsService.generateValidateFn(f)
            lines = lines.concat(validateFn)
            lines.push(``)
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
