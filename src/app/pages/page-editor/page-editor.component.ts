import {Component, inject} from '@angular/core'
import {AppService} from '../../services/app.service'
import {DataService} from '../../services/data.service'
import {PageGuiEditorComponent} from '../page-gui-editor/page-gui-editor.component'
import {PageTextEditorComponent} from '../page-text-editor/page-text-editor.component'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {PageSplitViewComponent} from '../page-split-view/page-split-view.component'
import {MatToolbarModule} from '@angular/material/toolbar'
import {MatTabsModule} from '@angular/material/tabs'
import {PageCodeOutputComponent} from '../page-code-output/page-code-output.component'

@Component({
    standalone: true,
    selector: 'app-page-editor',
    imports: [
        CommonModule,
        FormsModule,
        PageGuiEditorComponent,
        MatTabsModule,
        PageTextEditorComponent,
        MatToolbarModule,
        PageSplitViewComponent,
        PageCodeOutputComponent
    ],
    templateUrl: './page-editor.component.html',
    styleUrl: './page-editor.component.scss'
})
export class PageEditorComponent {
    readonly appService = inject(AppService)
    readonly dataService = inject(DataService)
}
