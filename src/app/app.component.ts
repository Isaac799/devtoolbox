import {Component, OnInit} from '@angular/core'
import {AppComplexityMode} from './structure'
import {CommonModule} from '@angular/common'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {GuiEditorComponent} from './gui-editor/gui-editor.component'
import {DataService} from './services/data.service'
import {CodeOutputComponent} from './code-output/code-output.component'
import {NotificationService} from './services/notification.service'
import {AppSettingsComponent} from './app-settings/app-settings.component'
import { TopBarComponent } from "./top-bar/top-bar.component";

@Component({
    selector: 'app-root',
    imports: [CommonModule, AppSettingsComponent, FormsModule, ReactiveFormsModule, GuiEditorComponent, CodeOutputComponent, TopBarComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
    readonly title = 'devtoolbox'

    complexityOptions = [
        {
            name: 'Easy Mode',
            value: AppComplexityMode.Simple
        },
        {
            name: 'Advanced Mode',
            value: AppComplexityMode.Advanced
        }
    ]

    constructor(public data: DataService, public notification: NotificationService) {}

    ngOnInit(): void {
        this.data.Initialize()
    }
}
