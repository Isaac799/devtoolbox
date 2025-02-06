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
        const parts: string[] = [AttrTypeMap[value.Type]]

        const min = value.Validation?.Min
        const max = value.Validation?.Max

        const sym = value.Type === AttrType.VARCHAR ? 'length ' : ''

        if (min !== undefined && max !== undefined) {
            parts.push(`${sym}between ${min} and ${max}`)
        } else {
            if (min !== undefined) {
                parts.push(`${sym}at least ${min}`)
            } else if (max !== undefined) {
                parts.push(`${sym}up to ${max}`)
            }
        }

        return parts.join(', ')
    }
}
