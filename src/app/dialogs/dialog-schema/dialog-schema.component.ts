import {CommonModule} from '@angular/common'
import {ChangeDetectorRef, Component, ElementRef, inject, ViewChild, OnInit, AfterViewInit} from '@angular/core'
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms'
import {MatDialogContent, MatDialogActions, MAT_DIALOG_DATA, MatDialogRef, MatDialogClose, MatDialogTitle} from '@angular/material/dialog'
import {Schema} from '../../structure'
import {v4 as uuidv4} from 'uuid'
import {MatButtonModule} from '@angular/material/button'
import {MatInputModule} from '@angular/material/input'
import {MatSelectModule} from '@angular/material/select'
import {ColorPickerModule} from 'ngx-color-picker'
import {MatChipsModule} from '@angular/material/chips'
import {AppService} from '../../services/app.service'

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
        MatDialogTitle,
        ColorPickerModule,
        MatChipsModule
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
    private appService = inject(AppService)
    private dialogRef = inject(MatDialogRef<DialogSchemaComponent>)
    @ViewChild('schemaName') schemaNameRef: ElementRef<HTMLInputElement> | null = null

    schemaForm = new FormGroup({
        Name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(128)]),
        Color: new FormControl('#0000FF', [Validators.required, Validators.minLength(7), Validators.maxLength(7)])
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
        this.finish()
    }

    clickSaveSchema() {
        if (!this.schemaForm.valid) return
        const c = this.schemaForm.controls
        if (this.data.s) {
            this.data.s.Name = c.Name.value!.trim()
            this.data.s.Color = c.Color.value!.trim()
        } else {
            this.data.ss.push(new Schema(uuidv4(), c.Name.value!, c.Color.value!))
        }
        this.finish()
    }

    private finish() {
        this.appService.Run('gui')
        this.appService.Save()
        this.dialogRef.close()
    }

    colorSuggestions = [
        {
            name: 'Red',
            hex: '#FF0000'
        },
        {
            name: 'Green',
            hex: '#00FF00'
        },
        {
            name: 'Blue',
            hex: '#0000FF'
        },
        {
            name: 'Yellow',
            hex: '#FFFF00'
        },
        {
            name: 'Orange',
            hex: '#FFA500'
        },
        {
            name: 'Purple',
            hex: '#800080'
        },
        {
            name: 'Pink',
            hex: '#FFC0CB'
        },
        {
            name: 'Cyan',
            hex: '#00FFFF'
        },
        {
            name: 'Black',
            hex: '#000000'
        },
        {
            name: 'White',
            hex: '#FFFFFF'
        }
    ]
}
