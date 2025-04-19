import {Pipe, PipeTransform} from '@angular/core'
import {AppGeneratorMode} from '../structure'

@Pipe({
    standalone: true,
    name: 'appModeCanPreview'
})
export class AppModeCanPreviewPipe implements PipeTransform {
    transform(value: AppGeneratorMode): boolean {
        const HTMLmodes = [AppGeneratorMode.RawHTML, AppGeneratorMode.RawBulma01HTML]
        return HTMLmodes.includes(value)
    }
}
