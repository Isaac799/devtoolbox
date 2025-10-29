import {Pipe, PipeTransform} from '@angular/core'
import {AttrType} from '../structure'

export const NUMERICS = [
    AttrType.DECIMAL,
    AttrType.REAL,
    AttrType.FLOAT,
    AttrType.SERIAL,
    AttrType.INT,
    // AttrType.VARCHAR,
    AttrType.MONEY
]

@Pipe({
    name: 'minMaxLabelFromAttrType'
})
export class MinMaxLabelFromAttrTypePipe implements PipeTransform {
    transform(value: AttrType | null, label: 'min' | 'max'): string {
        if (label === 'min') {
            if (!value) {
                return 'min'
            }
            if (NUMERICS.includes(value)) {
                return 'Minimum Number'
            }
            return 'Minimum Length'
        } else if (label === 'max') {
            if (!value) {
                return 'max'
            }
            if (NUMERICS.includes(value)) {
                return 'Maximum Number'
            }
            return 'Maximum Length'
        } else {
            return 'unknown min or max'
        }
    }
}
