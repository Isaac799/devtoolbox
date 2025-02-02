import {Component, inject, OnInit} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {MatSidenavModule} from '@angular/material/sidenav'
import {MatToolbarModule} from '@angular/material/toolbar'
import {MatIconModule} from '@angular/material/icon'
import {MatButtonModule} from '@angular/material/button'
import {RouterModule} from '@angular/router'
import {AppService} from './services/app.service'

@Component({
    selector: 'app-root',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, RouterModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
    readonly title = 'devtoolbox'
    private readonly appService = inject(AppService)

    ngOnInit(): void {
        this.appService.Initialize()
    }
}
