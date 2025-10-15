import {Component, inject} from '@angular/core'
import {MatButtonModule} from '@angular/material/button'
import {MatDialogContent, MatDialogActions, MAT_DIALOG_DATA, MatDialogClose, MatDialogTitle} from '@angular/material/dialog'

@Component({
    selector: 'app-dialog-confirm',
    imports: [MatDialogContent, MatDialogActions, MatDialogClose, MatDialogTitle, MatButtonModule],
    templateUrl: './dialog-confirm.component.html',
    styleUrl: './dialog-confirm.component.scss'
})
export class DialogConfirmComponent {
    data: {
        message: string
        accept: () => void
    } = inject(MAT_DIALOG_DATA)
}
