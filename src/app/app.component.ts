import {Component, OnInit} from '@angular/core'
import {AppComplexityMode} from './structure'
import {CommonModule} from '@angular/common'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {GuiEditorComponent} from './gui-editor/gui-editor.component'
import {DataService} from './services/data.service'
import {CodeOutputComponent} from './code-output/code-output.component'
import {NotificationService} from './services/notification.service'
import {AppSettingsComponent} from './app-settings/app-settings.component'
import {MatSidenavModule} from '@angular/material/sidenav'
import {MatToolbarModule} from '@angular/material/toolbar'
import {MatIconModule} from '@angular/material/icon'
import {MatButtonModule} from '@angular/material/button'

@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        AppSettingsComponent,
        FormsModule,
        ReactiveFormsModule,
        GuiEditorComponent,
        CodeOutputComponent,
        MatSidenavModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
    readonly title = 'devtoolbox'

    constructor(public data: DataService, public notification: NotificationService) {}

    ngOnInit(): void {
        this.data.Initialize()
    }
}
