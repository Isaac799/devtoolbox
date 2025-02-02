import {Component} from '@angular/core'
import {MatButtonModule} from '@angular/material/button'
import {MatDialogContent, MatDialogActions, MatDialogClose, MatDialogTitle} from '@angular/material/dialog'
import {MatIconModule} from '@angular/material/icon'
import {MatInputModule} from '@angular/material/input'
import {MatSelectModule} from '@angular/material/select'

@Component({
    standalone: true,
    selector: 'app-dialog-syntax-guide',
    imports: [MatDialogContent, MatDialogActions, MatButtonModule, MatInputModule, MatSelectModule, MatDialogClose, MatDialogTitle, MatIconModule],
    templateUrl: './dialog-syntax-guide.component.html',
    styleUrl: './dialog-syntax-guide.component.scss'
})
export class DialogSyntaxGuideComponent {}
