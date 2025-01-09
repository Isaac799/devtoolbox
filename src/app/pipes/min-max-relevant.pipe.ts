import {Pipe, PipeTransform} from '@angular/core'
import {AttrType} from '../structure'

const RELEVANT = [
    AttrType.DECIMAL,
    AttrType.REAL,
    AttrType.FLOAT,
    AttrType.SERIAL,
    AttrType.INT,
    AttrType.VARCHAR,
    AttrType.MONEY
]

@Pipe({
    name: 'minMaxRelevant'
})
export class MinMaxRelevantPipe implements PipeTransform {
    transform(value: AttrType | null): boolean {
        if (!value) {
            return false
        }
        if (RELEVANT.includes(value)) {
            return true
        }
        return false
    }
}
