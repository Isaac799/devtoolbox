import {Component, ViewChild, ElementRef, inject, AfterViewInit} from '@angular/core'
import {DataService} from '../../services/data.service'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {IsSeedModePipe} from '../../pipes/is-seed-mode.pipe'
import {AppService} from '../../services/app.service'
import {LanguageService} from '../../services/language.service'
import {AppModeCanPreviewPipe} from '../../pipes/app-mode-can-preview.pipe'
import {AppGeneratorMode} from '../../structure'
import {InformService} from '../../services/inform.service'

@Component({
    selector: 'app-page-code-output',
    imports: [CommonModule, FormsModule, IsSeedModePipe, AppModeCanPreviewPipe],
    templateUrl: './page-code-output.component.html',
    styleUrl: './page-code-output.component.scss'
})
export class PageCodeOutputComponent implements AfterViewInit {
    output = ''
    @ViewChild('codeOutput') codeOutputEl?: ElementRef<HTMLPreElement>

    readonly dataService = inject(DataService)
    private readonly languageService = inject(LanguageService)
    readonly appService = inject(AppService)
    readonly inform = inject(InformService)

    ngAfterViewInit(): void {
        this._render()

        this.appService.doRenderGenerated.subscribe(() => {
            this._render()
        })
    }

    private _render() {
        const generation = this.languageService.GenerateCode(this.dataService.schemas, this.appService.app.generatorMode, this.appService.app.seedLimit)
        this.output = generation.code
        if (!this.codeOutputEl?.nativeElement) {
            console.error('Missing this.codeGeneratorViewHtml')
            return
        }

        this.codeOutputEl.nativeElement.innerHTML = generation.html
    }

    OpenPreviewWindow() {
        const generation = this.languageService.GenerateCode(this.dataService.schemas, this.appService.app.generatorMode, this.appService.app.seedLimit)
        const newWin = window.open('', '_blank', 'width=600,height=400')

        if (!newWin) {
            this.inform.Mention('Failed to Open Preview Window')
            return
        }

        const includeBulma = [AppGeneratorMode.HTMLRawBulma01, AppGeneratorMode.HTMLGoTemplateBulma01].includes(this.appService.app.generatorMode)

        const defaultStyle = `html,
body {
    padding: 0;
    margin: 0;
    font-size: 16px;
    background-color: white;
    color: black;
}
    
.some-padding {
 padding: 1rem 
 }`

        let style = `<style>${defaultStyle}</style>`
        if (includeBulma) {
            const bulmaHelper = `<style>
.some-padding {
 padding: 1rem
 }</style>`
            style = `${bulmaHelper} <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css">`
        }

        const content = `
    <html>
      <head>
        <title>Preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${style}
        
      </head>
      <body>
      <div class="some-padding"> 
      ${generation.code}
      </div> 
      </body>
    </html>
  `

        this.inform.Mention('Opened in Preview Window')

        newWin.document.body.innerHTML = content
        newWin.document.close()
    }

    Copy() {
        navigator.clipboard.writeText(this.output)
        this.inform.Mention('Copied to clipboard')
    }

    ClearOutput() {
        if (!this.codeOutputEl?.nativeElement) {
            console.error('Missing this.codeGeneratorViewHtml')
            return
        }
        this.codeOutputEl.nativeElement.innerHTML = ''
    }
}
