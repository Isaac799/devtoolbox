import {CommonModule} from '@angular/common'
import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core'
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms'
import {Table, Schema} from '../../structure'
import {v4 as uuidv4} from 'uuid'
import {MatButtonModule} from '@angular/material/button'
import {MatInputModule} from '@angular/material/input'
import {MatSelectModule} from '@angular/material/select'
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog'
import {AppService} from '../../services/app.service'
@Component({
    standalone: true,
    selector: 'app-dialog-table',
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
    templateUrl: './dialog-table.component.html',
    styleUrl: './dialog-table.component.scss'
})
export class DialogTableComponent implements OnInit {
    data: {
        t: Table | undefined
        ss: Schema[]
        si: number
    } = inject(MAT_DIALOG_DATA)

    private cdr = inject(ChangeDetectorRef)
    private appService = inject(AppService)
    private dialogRef = inject(MatDialogRef<DialogTableComponent>)

    tableForm = new FormGroup({
        Name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(128)]),
        Schema: new FormControl<Schema | null>(null, [Validators.required])
    })

    ngOnInit(): void {
        if (this.data.t) {
            this.setTableForm(this.data.t)
        }
    }

    private setTableForm(t: Table) {
        this.tableForm.reset()
        this.tableForm.controls.Name.setValue(t.Name)
        this.tableForm.controls.Schema.setValue(this.data.ss[this.data.si])
        this.cdr.detectChanges()
    }

    clickDelTable() {
        const s = this.tableForm.controls.Schema.value
        if (!s) {
            return
        }
        const t = this.data.t
        if (!t) {
            return
        }
        const i = s.Tables.findIndex(e => e.ID === t.ID)
        if (i === -1) {
            return
        }
        s.Tables.splice(i, 1)
        this.finish()
    }

    clickSaveTable() {
        const s = this.tableForm.controls.Schema.value
        if (!s) {
            return
        }
        if (!this.tableForm.valid) return
        const c = this.tableForm.controls
        if (this.data.t) {
            this.data.t.Name = c.Name.value!.trim()
        } else {
            const newTbl = new Table(uuidv4(), c.Name.value!, s, {x: 0, y: 0})
            s.Tables.push(newTbl)
        }
        this.finish()
    }

    private finish() {
        this.appService.Run('gui')
        this.appService.Save()
        this.dialogRef.close()
    }
}
