import {CommonModule} from '@angular/common'
import {ChangeDetectorRef, Component, OnInit, inject} from '@angular/core'
import {AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms'
import {MatDialogContent, MatDialogActions, MAT_DIALOG_DATA, MatDialogRef, MatDialogClose, MatDialogTitle} from '@angular/material/dialog'
import {DefaultValueHintPipe} from '../../pipes/default-value-hint.pipe'
import {MinMaxLabelFromAttrTypePipe} from '../../pipes/min-max-label-from-attr-type.pipe'
import {MinMaxRelevantPipe} from '../../pipes/min-max-relevant.pipe'
import {AttrType, Table, validationMap, AttributeSuggestion, Schema, Attribute} from '../../structure'
import {v4 as uuidv4} from 'uuid'
import {MatButtonModule} from '@angular/material/button'
import {MatInputModule} from '@angular/material/input'
import {MatSelectModule} from '@angular/material/select'
import {MatChipsModule} from '@angular/material/chips'
import {MatCheckboxModule} from '@angular/material/checkbox'
import {MatDividerModule} from '@angular/material/divider'
import {AppService} from '../../services/app.service'

@Component({
    standalone: true,
    selector: 'app-dialog-attribute',
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
        MinMaxRelevantPipe,
        MinMaxLabelFromAttrTypePipe,
        DefaultValueHintPipe,
        MatInputModule,
        MatChipsModule,
        MatCheckboxModule,
        MatDividerModule
    ],
    templateUrl: './dialog-attribute.component.html',
    styleUrl: './dialog-attribute.component.scss'
})
export class DialogAttributeComponent implements OnInit {
    existingNames: string[] = []
    justSetIDName = false

    data: {
        a: Attribute | undefined
        t: Table
        s: Schema
        ss: Schema[]
    } = inject(MAT_DIALOG_DATA)

    private cdr = inject(ChangeDetectorRef)
    private appService = inject(AppService)
    private dialogRef = inject(MatDialogRef<DialogAttributeComponent>)

    private readonly idSuggestionName = 'unique identifier'

    get isReference(): boolean {
        return this.attributeForm.controls.Type.value === AttrType.REFERENCE
    }

    attributeForm = new FormGroup({
        Name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(63)]),
        Type: new FormControl<AttrType | null>(AttrType.VARCHAR, [Validators.required]),
        PrimaryKey: new FormControl(false, []),
        Readonly: new FormControl(false, []),
        // Unique: new FormControl<string[]>([], [Validators.required]),
        Unique: new FormControl<string[]>([], []),
        Default: new FormControl('', []),
        SystemField: new FormControl(false, []),
        Required: new FormControl(true, []),
        ReferenceTo: new FormControl<Table | null>(null, []),
        Min: new FormControl(0, []),
        Max: new FormControl(1, [])
    })

    readonly attrTypeOptions = [
        {name: 'Auto Increment', value: AttrType.SERIAL},
        {name: 'Reference', value: AttrType.REFERENCE},
        {name: 'Bit', value: AttrType.BIT},
        {name: 'Date', value: AttrType.DATE},
        {name: 'Character', value: AttrType.CHAR},
        {name: 'Time', value: AttrType.TIME},
        {name: 'Timestamp', value: AttrType.TIMESTAMP},
        {name: 'Decimal', value: AttrType.DECIMAL},
        {name: 'Real', value: AttrType.REAL},
        {name: 'Float', value: AttrType.FLOAT},
        {name: 'Money', value: AttrType.MONEY},
        {name: 'Integer', value: AttrType.INT},
        {name: 'Boolean', value: AttrType.BOOLEAN},
        {name: 'Varchar', value: AttrType.VARCHAR}
    ]

    readonly presetAttributes: AttributeSuggestion[] = [
        {
            Name: this.idSuggestionName,
            Type: AttrType.SERIAL,
            Option: {
                PrimaryKey: true,
                SystemField: true
            }
        },
        {
            Name: 'word',
            Type: AttrType.VARCHAR,
            Option: {
                Unique: ['a']
            },
            Validation: {
                Required: true,
                Min: 3,
                Max: 30
            }
        },
        {
            Name: 'sentence',
            Type: AttrType.VARCHAR,
            Validation: {
                Required: true,
                Min: 30,
                Max: 300
            }
        },
        {
            Name: 'number',
            Type: AttrType.FLOAT,
            Validation: {
                Required: true
            }
        },
        {
            Name: 'yes / no',
            Type: AttrType.BOOLEAN,
            Validation: {
                Required: true
            }
        },
        {
            Name: 'whole number',
            Type: AttrType.INT,
            Validation: {
                Required: true
            }
        },
        {
            Name: 'time',
            Type: AttrType.TIME,
            Validation: {
                Required: true
            }
        },
        {
            Name: 'date',
            Type: AttrType.DATE,
            Validation: {
                Required: true
            }
        },
        {
            Name: 'date time',
            Type: AttrType.TIMESTAMP,
            Option: {
                PrimaryKey: false,
                Default: 'CURRENT_TIMESTAMP',
                SystemField: true
            },
            Validation: {
                Required: true
            }
        },
        {
            Name: 'reference',
            Type: AttrType.REFERENCE,
            Validation: {
                Required: true
            }
        }
    ]

    private validDefault = () => {
        return (control: AbstractControl): ValidationErrors | null => {
            const c = this.attributeForm.controls

            if (!control.value) {
                return null
            }

            const t = c.Type.value

            if (t === null) {
                return {
                    invalid: 'missing type of attribute'
                }
            }

            const validatorFn = validationMap.get(t)

            if (!validatorFn) {
                console.error(`missing valid default fn for type ${t}`)
                return {
                    'internal error': 'not able to handle default value validation for attribute type'
                }
            }

            const a = validatorFn(control.value || '')
            const answer = a
                ? null
                : {
                      'invalid default value': 'please make another entry'
                  }
            return answer
        }
    }

    private validReference = () => {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!this.isReference) {
                return null
            }

            if (!control.value) {
                return {
                    'is required': 'reference is required'
                }
            }

            // const tbl = this.data.getReference(control.value);
            // if (!tbl) {
            //   return {
            //     'is invalid': 'reference is not a table I could find',
            //   };
            // }
            return null
        }
    }

    ngOnInit(): void {
        /**
         *
         * Trigger detection again on default value if the type changed is ref by
         *
         */
        this.attributeForm.controls.Type.valueChanges.subscribe(x => {
            this.attributeForm.controls.Default.setValue(this.attributeForm.controls.Default.value)
            if (x === AttrType.REFERENCE) {
                this.attributeForm.controls.Name.disable()
            } else {
                this.attributeForm.controls.ReferenceTo.setValue(null)
                this.attributeForm.controls.Name.enable()
            }

            if (x === AttrType.SERIAL) {
                this.attributeForm.controls.PrimaryKey.setValue(true)
                this.RequirePrimaryKey()
            } else if ((x && [AttrType.INT, AttrType.SERIAL, AttrType.VARCHAR].includes(x)) || x === AttrType.REFERENCE) {
                this.AllowPrimaryKey()
            } else {
                this.DenyPrimaryKey()
            }

            this.PrimaryKeyChange(this.attributeForm.controls.PrimaryKey.value || false)

            this.cdr.detectChanges()
        })

        this.attributeForm.controls.PrimaryKey.valueChanges.subscribe(x => {
            this.PrimaryKeyChange(x || false)
        })

        this.attributeForm.controls.ReferenceTo.valueChanges.subscribe(x => {
            if (x) {
                this.attributeForm.controls.Name.setValue(x?.Name || '')
                this.cdr.detectChanges()
            }
        })

        this.attributeForm.controls.ReferenceTo.addValidators(this.validReference())
        this.attributeForm.controls.Default.addValidators(this.validDefault())

        this.existingNames = this.data.t.Attributes.map(e => e.Name)

        if (!this.data.a) {
            this.attributeForm.reset()
            return
        }

        this.setAttributeForm(this.data.a)
    }

    private RequirePrimaryKey() {
        this.attributeForm.controls.PrimaryKey.disable()
        this.attributeForm.controls.PrimaryKey.setValue(true)
    }

    private DenyPrimaryKey() {
        this.attributeForm.controls.PrimaryKey.disable()
        this.attributeForm.controls.PrimaryKey.setValue(false)
    }

    private AllowPrimaryKey() {
        this.attributeForm.controls.PrimaryKey.enable()
    }

    private PrimaryKeyChange(isPrimaryKey: boolean) {
        if (isPrimaryKey && !this.isReference) {
            this.attributeForm.controls.Required.disable()
            this.attributeForm.controls.Unique.disable()
            this.attributeForm.controls.SystemField.disable()

            this.attributeForm.controls.Required.setValue(true)
            this.attributeForm.controls.Unique.setValue(['primary'])
            this.attributeForm.controls.SystemField.setValue(true)
        } else {
            this.attributeForm.controls.Required.setValue(false)
            this.attributeForm.controls.Unique.setValue([])
            this.attributeForm.controls.SystemField.setValue(false)

            this.attributeForm.controls.Required.enable()
            this.attributeForm.controls.Unique.enable()
            this.attributeForm.controls.SystemField.enable()
        }
        this.cdr.detectChanges()
    }

    private setAttributeForm(a: Attribute) {
        this.attributeForm.reset()

        const c = this.attributeForm.controls
        c.Name.setValue(a.Name)
        c.Type.setValue(a.Type!)
        if (a.RefTo !== undefined) {
            c.ReferenceTo.setValue(a.RefTo)
        }
        if (a.Option) {
            if (a.Option.PrimaryKey !== undefined) {
                c.PrimaryKey.setValue(a.Option.PrimaryKey)
            }
            if (a.Option.Unique !== undefined) {
                c.Unique.setValue(a.Option.Unique)
            }
            if (a.Option.Default !== undefined) {
                c.Default.setValue(a.Option.Default)
            }
            if (a.Option.SystemField !== undefined) {
                c.SystemField.setValue(a.Option.SystemField)
            }
        }
        if (a.Validation) {
            if (a.Validation.Required !== undefined) {
                c.Required.setValue(a.Validation.Required)
            }
            if (a.Validation.Min !== undefined) {
                c.Min.setValue(a.Validation.Min)
            }
            if (a.Validation.Max !== undefined) {
                c.Max.setValue(a.Validation.Max)
            }
        }
        this.cdr.detectChanges()
    }

    private finish() {
        this.appService.Run('gui')
        this.appService.Save()
        this.dialogRef.close()
    }

    clickDelAttribute() {
        if (!this.data.a) {
            return
        }

        const i = this.data.t.Attributes.findIndex(e => e.ID === this.data.a!.ID)
        if (i === -1) {
            return
        }
        this.data.t.Attributes.splice(i, 1)
        this.finish()
    }

    clickSaveAttribute() {
        if (!this.attributeForm.valid) return
        const f = this.attributeForm

        if (!this.data.a) {
            const newAttr = new Attribute(uuidv4(), f.controls.Name.value!, f.controls.Type.value!, this.data.t)

            if (newAttr.Type === AttrType.REFERENCE && f.controls.ReferenceTo.value) {
                newAttr.RefTo = f.controls.ReferenceTo.value
            }

            newAttr['Option'] = {
                Default: f.controls.Default.value!,
                Unique: f.controls.Unique.value!,
                PrimaryKey: f.controls.PrimaryKey.value!
            }
            newAttr['Validation'] = {
                Min: f.controls.Min.value!,
                Max: f.controls.Max.value!,
                Required: f.controls.Required.value!
            }

            this.data.t.Attributes.push(newAttr)

            this.dialogRef.close()

            return
        }

        this.data.a.Name = f.controls.Name.value!.trim()
        this.data.a.Type = f.controls.Type.value!

        if (this.data.a.Type === AttrType.REFERENCE && f.controls.ReferenceTo.value) {
            this.data.a.RefTo = f.controls.ReferenceTo.value
        }

        if (!this.data.a.Option) {
            this.data.a.Option = {}
        }
        if (f.controls.PrimaryKey.value !== null) {
            this.data.a.Option.PrimaryKey = f.controls.PrimaryKey.value
        } else {
            this.data.a.Option.PrimaryKey = undefined
        }
        if (f.controls.Unique.value !== null) {
            this.data.a.Option.Unique = f.controls.Unique.value
        } else {
            this.data.a.Option.Unique = undefined
        }
        if (f.controls.Default.value !== null) {
            this.data.a.Option.Default = f.controls.Default.value
        } else {
            this.data.a.Option.Default = undefined
        }
        if (f.controls.SystemField.value !== null) {
            this.data.a.Option.SystemField = f.controls.SystemField.value
        } else {
            this.data.a.Option.SystemField = undefined
        }

        if (!this.data.a.Validation) {
            this.data.a.Validation = {}
        }

        const minMaxRelevant = new MinMaxRelevantPipe().transform(f.controls.Type.value)
        if (f.controls.Min.value !== null && minMaxRelevant) {
            this.data.a.Validation.Min = f.controls.Min.value
        } else {
            this.data.a.Validation.Min = undefined
        }
        if (f.controls.Max.value !== null && minMaxRelevant) {
            this.data.a.Validation.Max = f.controls.Max.value
        } else {
            this.data.a.Validation.Max = undefined
        }

        if (f.controls.Required.value !== null) {
            this.data.a.Validation.Required = f.controls.Required.value
        } else {
            this.data.a.Validation.Required = undefined
        }
        this.finish()
    }

    clickSmartSuggestion(x: AttributeSuggestion) {
        this.attributeForm.controls.PrimaryKey.setValue(x.Option?.PrimaryKey || null)
        this.attributeForm.controls.Unique.setValue(x.Option?.Unique || null)
        this.attributeForm.controls.Default.setValue(x.Option?.Default || '')
        this.attributeForm.controls.SystemField.setValue(x.Option?.SystemField || null)
        this.attributeForm.controls.Required.setValue(x.Validation?.Required || null)
        this.attributeForm.controls.Min.setValue(x.Validation?.Min || null)
        this.attributeForm.controls.Max.setValue(x.Validation?.Max || null)

        this.attributeForm.controls.Type.setValue(x.Type)

        if (x.Name === this.idSuggestionName && this.attributeForm.controls.Name.invalid && !this.existingNames.includes(x.Name)) {
            this.justSetIDName = true
            this.attributeForm.controls.Name.setValue('id')
        }

        if (this.justSetIDName && x.Name !== this.idSuggestionName && this.attributeForm.controls.Name.value === 'id') {
            this.justSetIDName = false
            this.attributeForm.controls.Name.setValue('')
        }

        this.cdr.detectChanges()
    }

    get referenceOptions(): Table[] {
        const answer: Table[] = []
        // if (!this.selectedTable) {
        //   return [];
        // }
        if (!this.isReference) {
            return []
        }

        for (const s of this.data.ss) {
            for (const t of s.Tables) {
                // if (t.id === this.selectedTable.id) {
                //   continue;
                // }
                answer.push(t)
            }
        }

        return answer
    }
}
