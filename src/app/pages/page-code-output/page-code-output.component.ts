import {Component, ViewChild, ElementRef, inject, AfterViewInit} from '@angular/core'
import {MatButtonModule} from '@angular/material/button'
import {DataService} from '../../services/data.service'
import {MatTabsModule} from '@angular/material/tabs'
import {SideBarService} from '../../services/side-bar.service'
import {MatChipsModule} from '@angular/material/chips'
import {MatIconModule} from '@angular/material/icon'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {IsSeedModePipe} from '../../pipes/is-seed-mode.pipe'
import {MatSliderModule} from '@angular/material/slider'
import {MatSnackBar} from '@angular/material/snack-bar'
import {AppService} from '../../services/app.service'
import {LanguageService} from '../../services/language.service'
import {MatToolbarModule} from '@angular/material/toolbar'
import {MatTooltipModule} from '@angular/material/tooltip'
import {AppModeCanPreviewPipe} from '../../pipes/app-mode-can-preview.pipe'
import {AppGeneratorMode} from '../../structure'

@Component({
    selector: 'app-page-code-output',
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatTabsModule,
        MatChipsModule,
        MatIconModule,
        IsSeedModePipe,
        MatSliderModule,
        MatToolbarModule,
        MatTooltipModule,
        AppModeCanPreviewPipe
    ],
    templateUrl: './page-code-output.component.html',
    styleUrl: './page-code-output.component.scss'
})
export class PageCodeOutputComponent implements AfterViewInit {
    output = ''
    @ViewChild('codeOutput') codeOutputEl?: ElementRef<HTMLPreElement>

    readonly dataService = inject(DataService)
    readonly sideBarService = inject(SideBarService)
    private readonly languageService = inject(LanguageService)
    private readonly snackBar = inject(MatSnackBar)
    readonly appService = inject(AppService)

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
            this.snackBar.open('Failed to Open Preview Window', '', {
                duration: 2500
            })
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

        this.snackBar.open('Opened in Preview Window', '', {
            duration: 2500
        })

        newWin.document.body.innerHTML = content
        newWin.document.close()
    }

    Copy() {
        navigator.clipboard.writeText(this.output)
        this.snackBar.open('Copied to clipboard', '', {
            duration: 2500
        })
    }

    selectedTabChanged(event: number) {
        this.sideBarService.generatorModeSelectedIndex = [event, 0]
        this.sideBarService.setGenMode()
    }

    ClearOutput() {
        if (!this.codeOutputEl?.nativeElement) {
            console.error('Missing this.codeGeneratorViewHtml')
            return
        }
        this.codeOutputEl.nativeElement.innerHTML = ''
    }
}
