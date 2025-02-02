import {Component, ViewChild, ElementRef, inject, AfterViewInit, OnDestroy} from '@angular/core'
import {MatButtonModule} from '@angular/material/button'
import {Subscription} from 'rxjs'
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

@Component({
    selector: 'app-page-code-output',
    imports: [CommonModule, FormsModule, MatButtonModule, MatTabsModule, MatChipsModule, MatIconModule, IsSeedModePipe, MatSliderModule],
    templateUrl: './page-code-output.component.html',
    styleUrl: './page-code-output.component.scss'
})
export class PageCodeOutputComponent implements AfterViewInit, OnDestroy {
    output = ''
    subscription: Subscription | null = null
    @ViewChild('codeOutput') codeOutput?: ElementRef<HTMLPreElement>

    readonly dataService = inject(DataService)
    readonly sideBarService = inject(SideBarService)
    private readonly languageService = inject(LanguageService)
    private readonly snackBar = inject(MatSnackBar)
    readonly appService = inject(AppService)

    ngAfterViewInit(): void {
        this.subscription = this.dataService.schemasChange.subscribe(schemas => {
            const code = this.languageService.GenerateCode(
                schemas,
                this.dataService.app.generatorMode,
                this.dataService.app.seedLimit,
                this.dataService.varcharMap
            )
            if (!this.codeOutput?.nativeElement) {
                console.error('Missing this.codeGeneratorViewHtml')
                return
            }
            this.codeOutput.nativeElement.innerHTML = code
        })

        this.appService.EmitChangesForApp()
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe()
        }
    }

    copy() {
        navigator.clipboard.writeText(this.output)
        this.snackBar.open('Copied generate code to the clipboard', '', {
            duration: 2500
        })
    }

    selectedTabChanged(event: number) {
        this.sideBarService.generatorModeSelectedIndex = [event, 0]
        this.sideBarService.setGenMode()
    }
}
