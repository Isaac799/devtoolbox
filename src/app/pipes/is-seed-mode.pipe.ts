import {Pipe, PipeTransform} from '@angular/core'
import {AppGeneratorMode} from '../structure'

@Pipe({
    standalone: true,
    name: 'isSeedMode'
})
export class IsSeedModePipe implements PipeTransform {
    transform(value: AppGeneratorMode): boolean {
        return [AppGeneratorMode.PostgresSeed].includes(value)
    }
}
