import {Component, inject, OnInit} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {MatSidenavModule} from '@angular/material/sidenav'
import {MatToolbarModule} from '@angular/material/toolbar'
import {MatIconModule} from '@angular/material/icon'
import {MatButtonModule} from '@angular/material/button'
import {RouterModule} from '@angular/router'
import {AppService} from './services/app.service'
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout'
import {MatTooltipModule} from '@angular/material/tooltip'; 

@Component({
    selector: 'app-root',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, RouterModule, MatTooltipModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
    readonly title = 'devtoolbox'
    private readonly appService = inject(AppService)
    private readonly breakpointObserver = inject(BreakpointObserver)

    showSplitPage = false

    ngOnInit(): void {
        this.appService.Initialize()

        if (this.breakpointObserver.isMatched(Breakpoints.Large) || this.breakpointObserver.isMatched(Breakpoints.XLarge)) {
            this.showSplitPage = true
        }
    }
}
