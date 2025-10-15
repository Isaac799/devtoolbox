import {Pipe, PipeTransform} from '@angular/core'
import {Attribute, AttrType} from '../structure'
import {NUMERICS} from './min-max-label-from-attr-type.pipe'

@Pipe({
    name: 'attrIcon'
})
export class AttrIconPipe implements PipeTransform {
    transform(a: Attribute): string {
        if (a.Option?.PrimaryKey) {
            return 'key'
        } else if (a.RefTo) {
            return 'quick_reference_all'
        } else if (a.Type === AttrType.VARCHAR) {
            return 'text_fields'
        } else if (a.Type === AttrType.CHAR) {
            return 'text_fields'
        } else if (a.Type === AttrType.DATE) {
            return 'calendar_today'
        } else if (a.Type === AttrType.TIME) {
            return 'schedule'
        } else if (a.Type === AttrType.TIMESTAMP) {
            return 'calendar_clock'
        } else if (a.Type === AttrType.MONEY) {
            return 'attach_money'
        } else if (NUMERICS.includes(a.Type)) {
            return 'tag'
        }
        return 'radio_button_unchecked'
    }
}
