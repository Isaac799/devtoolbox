import {Pipe, PipeTransform} from '@angular/core'
import {AttrType, Attribute} from '../structure'

const AttrTypeMap: Record<AttrType, string> = {
    [AttrType.BIT]: 'bit',
    [AttrType.DATE]: 'date',
    [AttrType.CHAR]: 'character',
    [AttrType.TIME]: 'time',
    [AttrType.TIMESTAMP]: 'timestamp',
    [AttrType.DECIMAL]: 'decimal',
    [AttrType.REAL]: 'real',
    [AttrType.FLOAT]: 'float',
    [AttrType.SERIAL]: 'auto increment',
    [AttrType.INT]: 'int',
    [AttrType.BOOLEAN]: 'bool',
    [AttrType.VARCHAR]: 'string',
    [AttrType.MONEY]: '$',
    [AttrType.REFERENCE]: 'ref'
}

@Pipe({
    name: 'prettyType'
})
export class PrettyTypePipe implements PipeTransform {
    transform(value: Attribute): string {
        const parts: string[] = []
        // parts.push(AttrTypeMap[value.Type]) // show with icon now

        const min = value.Validation?.Min
        const max = value.Validation?.Max

        const sym = value.Type === AttrType.VARCHAR ? ' characters' : ''

        if (min && max) {
            parts.push(`${min} to ${max} ${sym}`)
        } else {
            if (min !== undefined) {
                parts.push(`at least ${min}${sym}`)
            } else if (max !== undefined) {
                parts.push(`up to ${max} ${sym}`)
            }
        }

        if (parts.length === 0) {
            return ''
        }

        return `(${parts.join(', ')})`
    }
}
