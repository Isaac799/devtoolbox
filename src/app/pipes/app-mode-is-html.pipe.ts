import {Pipe, PipeTransform} from '@angular/core'
import {AppGeneratorMode} from '../structure'

@Pipe({
    standalone: true,
    name: 'appModeIsHtml'
})
export class AppModeIsHtmlPipe implements PipeTransform {
    transform(value: AppGeneratorMode): boolean {
        const HTMLmodes = [AppGeneratorMode.RawHTML, AppGeneratorMode.GoTemplateHTML, AppGeneratorMode.RawBulma01HTML, AppGeneratorMode.GoTemplateBulma01HTML]
        return HTMLmodes.includes(value)
    }
}
