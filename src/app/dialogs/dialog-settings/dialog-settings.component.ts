import {Component, inject} from '@angular/core'
import {AppService} from '../../services/app.service'
import {DataService} from '../../services/data.service'
import {MatSlideToggleModule} from '@angular/material/slide-toggle'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {MatButtonModule} from '@angular/material/button'
import {MatDialogContent, MatDialogActions, MatDialogClose, MatDialogTitle} from '@angular/material/dialog'
import {MatSnackBar} from '@angular/material/snack-bar'

@Component({
    standalone: true,
    selector: 'app-dialog-settings',
    imports: [CommonModule, FormsModule, MatDialogContent, MatDialogActions, MatDialogClose, MatDialogTitle, MatButtonModule, MatSlideToggleModule],
    templateUrl: './dialog-settings.component.html',
    styleUrl: './dialog-settings.component.scss'
})
export class DialogSettingsComponent {
    readonly appService = inject(AppService)
    readonly dataService = inject(DataService)
    private readonly snackBar = inject(MatSnackBar)

    reset() {
        this.appService.app.editor = {
            gui: false,
            splitTui: true
        }
        this.snackBar.open('Using Recommended Settings', '', {
            duration: 2500
        })
    }
}
