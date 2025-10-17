import {Pipe, PipeTransform} from '@angular/core'
import {cc} from '../formatting'

@Pipe({
    name: 'trueTitle'
})
export class TrueTitlePipe implements PipeTransform {
    transform(value: string): string {
        return cc(value, 'tc')
    }
}
