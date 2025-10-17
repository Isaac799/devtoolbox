import {Pipe, PipeTransform} from '@angular/core'

@Pipe({
    standalone: true,
    name: 'includes'
})
export class IncludesPipe implements PipeTransform {
    transform(x: string, arr: string[]): boolean {
        return arr.includes(x)
    }
}
