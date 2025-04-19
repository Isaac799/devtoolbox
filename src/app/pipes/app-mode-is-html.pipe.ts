import {Pipe, PipeTransform} from '@angular/core'
import {AppGeneratorMode} from '../structure'

@Pipe({
    standalone: true,
    name: 'appModeIsHtml'
})
export class AppModeIsHtmlPipe implements PipeTransform {
    transform(value: AppGeneratorMode): boolean {
        const HTMLmodes = [AppGeneratorMode.HTMLRaw, AppGeneratorMode.HTMLGoTemplate, AppGeneratorMode.HTMLRawBulma01, AppGeneratorMode.HTMLGoTemplateBulma01]
        return HTMLmodes.includes(value)
    }
}
