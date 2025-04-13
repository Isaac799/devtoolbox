import {CommonModule} from '@angular/common'
import {Component, inject} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {MatButtonModule} from '@angular/material/button'
import {MatChipsModule} from '@angular/material/chips'
import {MatIconModule} from '@angular/material/icon'
import {MatSelectModule} from '@angular/material/select'
import {MatSliderModule} from '@angular/material/slider'
import {SideBarService} from '../../services/side-bar.service'
import {AppService} from '../../services/app.service'
import {CanvasSize, Schema} from '../../structure'
import {MatListModule} from '@angular/material/list'
import {DataService} from '../../services/data.service'
import {CdkDragDrop, CdkDrag, CdkDropList, CdkDropListGroup, moveItemInArray} from '@angular/cdk/drag-drop'

@Component({
    standalone: true,
    selector: 'app-side-bar-editor',
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatSliderModule,
        MatChipsModule,
        MatListModule,
        CdkDropListGroup,
        CdkDropList,
        CdkDrag
    ],
    templateUrl: './side-bar-editor.component.html',
    styleUrl: './side-bar-editor.component.scss'
})
export class SideBarEditorComponent {
    readonly appService = inject(AppService)
    readonly dataService = inject(DataService)
    readonly sideBarService = inject(SideBarService)

    compareWithCanvasSize(a: CanvasSize, b: CanvasSize): boolean {
        return a.name === b.name
    }

    drop(event: CdkDragDrop<Schema[]>) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex)
        this.appService.Run('gui')
        this.appService.Save()
    }
}
