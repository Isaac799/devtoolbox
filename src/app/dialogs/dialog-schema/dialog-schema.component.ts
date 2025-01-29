import {CommonModule} from '@angular/common'
import {ChangeDetectorRef, Component, ElementRef, inject, ViewChild, OnInit, AfterViewInit} from '@angular/core'
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms'
import {MatDialogContent, MatDialogActions, MAT_DIALOG_DATA, MatDialogRef, MatDialogClose, MatDialogTitle} from '@angular/material/dialog'
import {Schema} from '../../structure'
import {v4 as uuidv4} from 'uuid'
import {MatButtonModule} from '@angular/material/button'
import {MatInputModule} from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'

@Component({
    standalone: true,
    selector: 'app-dialog-schema',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatDialogContent,
        MatDialogActions,
        MatButtonModule,
        MatInputModule,
        MatSelectModule,
        MatDialogClose,
        MatDialogTitle
    ],
    templateUrl: './dialog-schema.component.html',
    styleUrl: './dialog-schema.component.scss'
})
export class DialogSchemaComponent implements OnInit, AfterViewInit {
    data: {
        s: Schema | undefined
        ss: Schema[]
    } = inject(MAT_DIALOG_DATA)

    private cdr = inject(ChangeDetectorRef)
    private dialogRef = inject(MatDialogRef<DialogSchemaComponent>)
    @ViewChild('schemaName') schemaNameRef: ElementRef<HTMLInputElement> | null = null

    schemaForm = new FormGroup({
        Name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(128)])
    })

    ngOnInit(): void {
        if (this.data.s) {
            this.setSchemaForm(this.data.s)
        }
    }

    private setSchemaForm(s: Schema) {
        this.schemaForm.reset()
        this.schemaForm.controls.Name.setValue(s.Name)
        this.cdr.detectChanges()
    }

    ngAfterViewInit(): void {
        if (this.schemaNameRef) {
            this.schemaNameRef.nativeElement.focus()
        }
    }

    clickDelSchema() {
        const s = this.data.s
        if (!s) {
            return
        }
        const i = this.data.ss.findIndex(e => e.ID === s.ID)
        if (i === -1) {
            return
        }
        this.data.ss.splice(i, 1)
        this.dialogRef.close()
    }

    clickSaveSchema() {
        if (!this.schemaForm.valid) return
        const c = this.schemaForm.controls
        if (this.data.s) {
            this.data.s.Name = c.Name.value!.trim()
        } else {
            this.data.ss.push(new Schema(uuidv4(), c.Name.value!))
        }
        this.dialogRef.close()
    }
}
