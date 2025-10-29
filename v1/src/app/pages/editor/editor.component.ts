import {Component} from '@angular/core'
import {PageCodeOutputComponent} from '../page-code-output/page-code-output.component'
import {PageTextEditorComponent} from '../page-text-editor/page-text-editor.component'

@Component({
    selector: 'app-editor',
    imports: [PageCodeOutputComponent, PageTextEditorComponent],
    templateUrl: './editor.component.html',
    styleUrl: './editor.component.scss'
})
export class EditorComponent {}
