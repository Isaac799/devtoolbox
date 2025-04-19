import {Injectable} from '@angular/core'
import {cc} from '../../formatting'
import {Schema, Func, AppGeneratorMode, Attribute, AttrType, Validation, SQL_TO_HTML_BULMA_CLASS, SQL_TO_HTML_INPUT_TYPE} from '../../structure'

// eec9e0030dc8f4f059b094b1e4323f37e3882b58

export type HtmlGenerator =
    | AppGeneratorMode.RawHTML
    | AppGeneratorMode.RawBulma01HTML
    | AppGeneratorMode.GoTemplateHTML
    | AppGeneratorMode.GoTemplateBulma01HTML

export type CssClasses = 'none' | 'bulma01'
export type SSR = 'none' | 'go template'

@Injectable({
    providedIn: 'root'
})
export class LanguageHtmlService {
    static ToForms(schemas: Schema[], mode: HtmlGenerator): string {
        const funcs: Func[] = []
        for (const s of schemas) {
            for (const t of s.Tables) {
                const func = new Func(t, AppGeneratorMode.GoStructsAndFns)
                funcs.push(func)
            }
        }

        let lines: string[] = []

        const elNameDiscalimer = `<!--

This demo template is more specific with its 'name' attribute on elements
in order to prevent overlap. You pay prefer to remove some of the specificity 
to modify the form submission data structure

-->
`
        lines.push(elNameDiscalimer)

        if (mode === AppGeneratorMode.GoTemplateHTML || mode === AppGeneratorMode.GoTemplateBulma01HTML) {
            const disclaimer = `<!--

This demo template takes in 'Data', like so

\`\`\`go
type Data[T any] struct {
    Record *T
}
\`\`\`

Doing so allows us to have a partially filled out form for SSR is a submission fails
We can also add other properties, like 'User' to 'Data', allowing rendering of personalized
parts of the page, without the form data 
                
-->
`
            lines.push(disclaimer)
        }

        for (const f of funcs) {
            // Struct
            if (mode === AppGeneratorMode.RawHTML) {
                lines = LanguageHtmlService.ToRawForm(lines, f, 'none', 'none')
            } else if (mode === AppGeneratorMode.RawBulma01HTML) {
                lines = LanguageHtmlService.ToRawForm(lines, f, 'bulma01', 'none')
            } else if (mode === AppGeneratorMode.GoTemplateHTML || mode === AppGeneratorMode.GoTemplateBulma01HTML) {
                if (mode === AppGeneratorMode.GoTemplateBulma01HTML) {
                    lines = LanguageHtmlService.ToRawForm(lines, f, 'bulma01', 'go template')
                } else if (mode === AppGeneratorMode.GoTemplateHTML) {
                    lines = LanguageHtmlService.ToRawForm(lines, f, 'none', 'go template')
                }
            }
        }

        const str = lines.join('\n')
        return str
    }

    private static ToRawForm(lines: string[], f: Func, css: CssClasses, ssr: SSR) {
        lines.push(`<h2>${cc(f.title, 'tc')}<h2/>\n`)
        const attrs: string[] = f.outputs.map(e => {
            if (e.raw.attribute.isBool()) {
                return boolRadioHtmlInput(e.raw.attribute, e.label, css, ssr)
            } else {
                return genericHtmlInput(e.raw.attribute, e.label, css, ssr)
            }
        })
        lines = lines.concat(attrs)

        lines.push(`\n<hr />\n`)
        return lines
    }
}

function boolRadioHtmlInput(x: Attribute, setValueToThisAttribute: string, cssClass: CssClasses, ssr: SSR) {
    let classFieldSet = ''
    if (cssClass === 'bulma01') {
        classFieldSet = `  class="control"`
    }
    let classLabel = ''
    if (cssClass === 'bulma01') {
        classLabel = ` class="radio"`
    }

    let ssrInputT = ''
    if (ssr === 'go template') {
        ssrInputT = `
            {{ if .Data }}
                {{if .Data.Record.${setValueToThisAttribute}}}checked{{end}}
            {{ else }}{{ end }}    `
    }
    let ssrInputF = ''
    if (ssr === 'go template') {
        ssrInputF = `
            {{ if .Data }}
                {{if not .Data.Record.${setValueToThisAttribute}}}checked{{end}}
            {{ else }}{{ end }}    `
    }

    return `<fieldset${classFieldSet}>
    <legend><strong>${cc(x.Name, 'tc')}:</strong></legend>
    <label${classLabel}>
        <input
            type="radio" 
            value="true"
            name="${cc(x.PFN, 'sk')}"${x.isNullable() ? '' : '\n                    required'}${ssrInputT}
        >
        True
    </label>
    <label${classLabel}>
        <input 
            type="radio" 
            value="false"
            name="${cc(x.PFN, 'sk')}"${ssrInputF}
        >
        False
    </label>
</fieldset>`
}

function genericHtmlInput(x: Attribute, setValueToThisAttribute: string, cssClass: CssClasses, ssr: SSR) {
    let classDivContainer = ''
    if (cssClass === 'bulma01') {
        classDivContainer = ` class="field"`
    }
    let classDiv = ''
    if (cssClass === 'bulma01') {
        classDiv = `  class="control"`
    }
    let classInput = ''
    if (cssClass === 'bulma01') {
        classInput = `
        class="${SQL_TO_HTML_BULMA_CLASS[x.Type]}"`
    }
    let classLabel = ''
    if (cssClass === 'bulma01') {
        classLabel = ` class="label"`
    }

    let ssrInput = ''
    if (ssr === 'go template') {
        ssrInput = `
        {{ if .Data }}
        ${setValueToThisAttribute ? `value="{{ .Data.Record.${setValueToThisAttribute} }}"` : ''}
        {{ else }}{{ end }}  `
    }

    const rangePhrase = generateRangePhrase(x.Validation, x.Type)
    return `<div${classDivContainer}>
  <label${classLabel} for="${cc(x.PFN, 'sk')}">${cc(x.Name, 'tc')}</label>
  <div${classDiv}>
      <input${classInput}
          type="${SQL_TO_HTML_INPUT_TYPE[x.Type]}"
          id="${cc(x.PFN, 'sk')}"
          name="${cc(x.PFN, 'sk')}"
          ${x.isNullable() ? '' : 'required'}
          ${rangePhrase}${ssrInput}
      />
  </div>
</div>`
}

function determineStepRange(range: {min: number | undefined; max: number | undefined}): number {
    const {min, max} = range

    // calculates step based on a stringified decimal
    const calculateStep = (value: number): number => {
        const decimalIndex = value + ''.indexOf('.')

        if (decimalIndex === -1) {
            return 1
        }

        const decimalPart = value + ''.slice(decimalIndex + 1)
        const stepValue = Math.pow(10, -decimalPart.length)

        return stepValue
    }

    const stepMin = min === undefined ? 0 : calculateStep(min)
    const stepMax = max === undefined ? 0 : calculateStep(max)

    // use the more precise step (smaller)
    let step = stepMin < stepMax ? stepMin : stepMax
    if (step === 0) {
        step = 1
    }
    return step
}

function generateRangePhrase(validation: Validation | undefined, sqlT: AttrType) {
    if (!validation) return ''
    const range = {
        min: validation.Min,
        max: validation.Max
    }
    let rangePhrase = ''
    const nums = [AttrType.SERIAL, AttrType.DECIMAL, AttrType.FLOAT, AttrType.REAL, AttrType.INT]
    const strs = [AttrType.VARCHAR]
    if (range) {
        if (nums.includes(sqlT)) {
            const min = range.min === undefined ? '' : `min="${range.min}"`
            const max = range.max === undefined ? '' : `max="${range.max}"`
            const step = `step="${determineStepRange(range)}"`
            rangePhrase = [min, max, step].filter(e => e).join(' ')
        } else if (strs.includes(sqlT)) {
            const min = range.min === undefined ? '' : `minlength="${range.min}"`
            const max = range.max === undefined ? '' : `maxlength="${range.max}"`
            rangePhrase = [min, max].filter(e => e).join(' ')
        }
    }
    return rangePhrase
}
