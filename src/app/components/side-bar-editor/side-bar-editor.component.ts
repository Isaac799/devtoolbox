import {CommonModule} from '@angular/common'
import {Component, inject} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {MatButtonModule} from '@angular/material/button'
import {MatChipsModule} from '@angular/material/chips'
import {MatIconModule} from '@angular/material/icon'
import {MatSelectModule} from '@angular/material/select'
import {MatSliderModule} from '@angular/material/slider'
import {SideBarService} from '../../services/side-bar.service'
import { AppService } from '../../services/app.service'

@Component({
    standalone: true,
    selector: 'app-side-bar-editor',
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatSelectModule, MatSliderModule, MatChipsModule],
    templateUrl: './side-bar-editor.component.html',
    styleUrl: './side-bar-editor.component.scss'
})
export class SideBarEditorComponent {
    readonly appService = inject(AppService)
    readonly sideBarService = inject(SideBarService)
}
