import {Component, OnInit} from '@angular/core'
import {AppComplexityMode} from './structure'
import {CommonModule} from '@angular/common'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {GuiEditorComponent} from './gui-editor/gui-editor.component'
import {DataService} from './services/data.service'
import {CodeOutputComponent} from './code-output/code-output.component'
import {NotificationService} from './services/notification.service'

@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        GuiEditorComponent,
        CodeOutputComponent,
    ],
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

    constructor(
        public data: DataService,
        public notification: NotificationService
    ) {}

    ngOnInit(): void {
        this.data.Initialize()
    }
}
