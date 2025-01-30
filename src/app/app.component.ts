import {Component, inject, OnInit} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {DataService} from './services/data.service'
import {NotificationService} from './services/notification.service'
import {AppSettingsComponent} from './app-settings/app-settings.component'
import {MatSidenavModule} from '@angular/material/sidenav'
import {MatToolbarModule} from '@angular/material/toolbar'
import {MatIconModule} from '@angular/material/icon'
import {MatButtonModule} from '@angular/material/button'
import {MatDialog} from '@angular/material/dialog'
import {RouterModule} from '@angular/router'

@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        AppSettingsComponent,
        FormsModule,
        ReactiveFormsModule,
        MatSidenavModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        RouterModule
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
    readonly title = 'devtoolbox'

    private matDialog = inject(MatDialog)

    constructor(public data: DataService, public notification: NotificationService) {}

    ngOnInit(): void {
        this.data.Initialize()
    }
}
