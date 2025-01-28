import {ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, AfterViewInit} from '@angular/core'
import {DataService} from '../services/data.service'
import {Schema, AttrType, Table, Attribute, AppComplexityMode, AttributeSuggestion, validationMap} from '../structure'
import {AbstractControl, ValidationErrors, Validators, FormGroup, FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms'
import {MinMaxRelevantPipe} from '../pipes/min-max-relevant.pipe'
import {ModalComponent} from '../modal/modal.component'
import {CommonModule} from '@angular/common'
import {MinMaxLabelFromAttrTypePipe} from '../pipes/min-max-label-from-attr-type.pipe'
import {DefaultValueHintPipe} from '../pipes/default-value-hint.pipe'
import {NotificationService} from '../services/notification.service'
import {CdkDrag, CdkDragEnd, DragDropModule} from '@angular/cdk/drag-drop'

@Component({
    selector: 'app-gui-editor',
    imports: [
        ModalComponent,
        FormsModule,
        CommonModule,
        ReactiveFormsModule,
        MinMaxRelevantPipe,
        MinMaxLabelFromAttrTypePipe,
        DefaultValueHintPipe,
        DragDropModule,
        CdkDrag
    ],
    templateUrl: './gui-editor.component.html',
    styleUrl: './gui-editor.component.scss'
})
export class GuiEditorComponent implements OnInit, AfterViewInit {
    hoveredTable: Table | null = null
    hoveredSchema: Schema | null = null

    bend = false
    showMoves = false
    readonly showMovesTimeoutMS: number = 500

    get isReference(): boolean {
        return this.attributeForm.controls.Type.value === AttrType.REFERENCE
    }

    showModalSchema = false
    showModalTable = false
    showModalAttribute = false

    showAttrOptions = false
    showAttrValidation = false
    showSmartAttributes = false

    private _serial = 0
    private get serial() {
        return this._serial
    }
    private set serial(value) {
        this._serial = value
    }

    private _selectedAttribute: Attribute | null = null
    public get selectedAttribute(): Attribute | null {
        return this._selectedAttribute
    }
    public set selectedAttribute(value: Attribute | null) {
        if (value?.ID !== this.selectedAttribute?.ID) {
            this.attributeForm.reset()
        }
        this._selectedAttribute = value
    }
    private _selectedTable: Table | null = null
    public get selectedTable(): Table | null {
        return this._selectedTable
    }
    public set selectedTable(value: Table | null) {
        if (value?.ID !== this.selectedTable?.ID) {
            this.tableForm.reset()
        }
        this._selectedTable = value
    }
    private _selectedSchema: Schema | null = null
    public get selectedSchema(): Schema | null {
        return this._selectedSchema
    }
    public set selectedSchema(value: Schema | null) {
        if (value?.ID !== this.selectedSchema?.ID) {
            this.schemaForm.reset()
        }
        this._selectedSchema = value
    }

    @ViewChild('canvas') canvasRef: ElementRef<HTMLCanvasElement> | undefined = undefined
    @ViewChild('schemaName') schemaNameRef: ElementRef | null = null
    @ViewChild('tableName') tableNameRef: ElementRef | null = null
    @ViewChild('attrName') attrNameRef: ElementRef | null = null

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

    nameValidation = [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(128)
        // Validators.pattern(this.regexSnakeCase),
    ]

    schemaForm = new FormGroup({
        Name: new FormControl('', this.nameValidation)
    })

    tableForm = new FormGroup({
        Name: new FormControl('', this.nameValidation)
    })

    attributeForm = new FormGroup({
        Name: new FormControl('', this.nameValidation),
        Type: new FormControl<AttrType | null>(AttrType.VARCHAR, [Validators.required]),
        PrimaryKey: new FormControl(false, []),
        Readonly: new FormControl(false, []),
        // Unique: new FormControl<string[]>([], [Validators.required]),
        Unique: new FormControl(false, []),
        Default: new FormControl('', []),
        SystemField: new FormControl(false, []),
        Required: new FormControl(true, []),
        ReferenceTo: new FormControl<Table | null>(null, []),
        Min: new FormControl(0, []),
        Max: new FormControl(1, [])
    })

    private readonly presetAttributes: AttributeSuggestion[] = [
        {
            Name: 'id',
            Type: AttrType.SERIAL,
            Option: {
                PrimaryKey: true,
                SystemField: true
            }
        },
        {
            Name: 'title',
            Type: AttrType.VARCHAR,
            Option: {
                PrimaryKey: false,
                Unique: true
            },
            Validation: {
                Required: true,
                Min: 3,
                Max: 31
            }
        },
        {
            Name: 'inserted_at',
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
            Name: 'updated_at',
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
            Name: 'email',
            Type: AttrType.VARCHAR,
            Option: {
                Unique: true
            },
            Validation: {
                Min: 5,
                Max: 63,
                Required: true
            }
        },
        {
            Name: 'parent',
            Type: AttrType.REFERENCE,
            Validation: {
                Required: true
            }
        }
    ]

    private readonly attrTypeOptionsSimple = [
        {name: 'Auto Increment', value: AttrType.SERIAL},
        {name: 'Reference', value: AttrType.REFERENCE},
        {name: 'Word', value: AttrType.VARCHAR},
        {name: 'Whole Number', value: AttrType.INT},
        {name: 'Fractional Number', value: AttrType.REAL},
        {name: 'Single Character', value: AttrType.CHAR},
        {name: 'Date and Time', value: AttrType.TIMESTAMP},
        {name: 'Money', value: AttrType.MONEY},
        {name: 'True or False', value: AttrType.BOOLEAN}
    ]

    private readonly attrTypeOptionsAdvanced = [
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

    public get attrTypeOptions() {
        return this.data.app.complexity === AppComplexityMode.Simple ? this.attrTypeOptionsSimple : this.attrTypeOptionsAdvanced
    }

    constructor(private cdr: ChangeDetectorRef, public data: DataService, private notification: NotificationService) {}

    ngAfterViewInit() {
        setTimeout(() => {
            this.redraw()
        }, 500)
    }

    redraw() {
        if (!this.canvasRef) {
            return
        }
        const canvas = this.canvasRef.nativeElement
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            return
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height) // Clear the canvas before redrawing
        this.drawLines()
    }

    drawLines() {
        if (!this.canvasRef) {
            return
        }
        const canvas = this.canvasRef.nativeElement
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            return
        }

        let offset = 0
        const offsetGrow = 8

        for (const s of this.data.schemas) {
            for (const t of s.Tables) {
                for (const a of t.Attributes) {
                    if (!a.RefTo) {
                        continue
                    }
                    this.DrawLine(t, a, ctx, offset)
                    offset += offsetGrow
                }
                offset = 0
            }
        }
    }

    private DrawLine(t: Table, a: Attribute, ctx: CanvasRenderingContext2D, offset: number) {
        const sourceTable = t
        const targetTable = a.RefTo!

        const targetTableEl = document.getElementById('table:' + targetTable.ID)!
        const attrEl = document.getElementById('attribute:' + a.ID)!
        const rootEl = document.getElementById('root-editor')!

        const targetTableRect = targetTableEl.getBoundingClientRect()
        const rootElRect = rootEl.getBoundingClientRect()
        const attrElRect = attrEl.getBoundingClientRect()

        const REM = 16

        const attrSrc = {
            x: attrElRect.left - rootElRect.left - REM * 1.2,
            y: attrElRect.top - rootElRect.top - REM / 5
        }
        const targetTableSrc = {
            x: targetTableRect.left - rootElRect.left,
            y: targetTableRect.top - rootElRect.top
        }

        // Get the positions of the tables (centered positions)
        let sourceX = attrSrc.x + REM // Center of element
        const sourceY = attrSrc.y + REM

        let targetX = targetTableSrc.x + REM / 2 // Center of element
        let targetY = targetTableSrc.y + REM / 2

        const widthToOvercome = attrElRect.width - REM
        const heightToOvercome = attrElRect.width - REM
        const xDiff = sourceX - targetX
        const yDiff = sourceY - targetY

        if (Math.abs(xDiff) > widthToOvercome && xDiff > 0) {
            targetX += targetTableRect.width - REM 
        }

        if (Math.abs(yDiff) > heightToOvercome && yDiff > 0) {
            targetY += targetTableRect.height - REM * 1.2
        }

        if (Math.abs(xDiff) > widthToOvercome && xDiff < 0) {
            sourceX += attrElRect.width + REM / 4
        }

        // if (Math.abs(sourceX - targetX) < widthToOvercome && sourceX > targetX) {
        //     sourceX += widthToOvercome + REM
        // }

        // Calculate the middle point for the bend
        let bendX = sourceX
        let bendY = sourceY

        // Logic to determine where the bend should happen
        if (Math.abs(targetX - sourceX) > Math.abs(targetY - sourceY)) {
            // If the horizontal distance is larger, bend horizontally
            bendX = targetX > sourceX ? targetX - 100 : targetX + 100 // Move bend left or right
        } else {
            // If the vertical distance is larger, bend vertically
            bendY = targetY > sourceY ? targetY - 100 : targetY + 100 // Move bend up or down
        }

        // Additional bend 16px away from the source
        const extraBendOffset = REM * 2

        // If the source is to the left of the target, extend to the right
        if (sourceX < targetX) {
            bendX += extraBendOffset // Extend right
        } else {
            bendX -= extraBendOffset // Extend left
        }

        // prevent early bends into src body
        if (bendX > attrSrc.x && bendX < attrSrc.x + attrElRect.width) {
            if (Math.abs(bendX - attrSrc.x) > Math.abs(bendX - (attrSrc.x + attrElRect.width))) {
                bendX += extraBendOffset * 2
            } else {
                bendX -= extraBendOffset * 2
            }
        }

        // const sourceMidX = (targetTableSrc.x + targetTableRect.width) / 2

        // // && targetY > sourceY
        // if (targetX < sourceMidX) {
        //     console.log(t.Name)
        //     sourceX += widthToOvercome + REM * 1.2
        //     targetX += widthToOvercome
        //     bendX += widthToOvercome + REM * 6
        // }

        const gradient = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY)
        gradient.addColorStop(0, 'rgba(0, 114, 178, 1)')
        gradient.addColorStop(0.8, 'rgba(0,0,0,0.3)')
        gradient.addColorStop(1, 'rgba(0,0,0,0.1)')

        // Set the gradient as the stroke style
        ctx.strokeStyle = gradient
        ctx.lineWidth = 4
        ctx.beginPath()

        // prevent overlap

        if (bendX > attrSrc.x) {
            bendX += offset
        } else {
            bendX -= offset
        }
        if (bendY > attrSrc.y) {
            bendY += offset
        } else {
            bendY -= offset
        }

        // Calculate the distance between the bend and target points
        const distance = Math.sqrt(Math.pow(sourceX - bendX, 2) + Math.pow(sourceY - bendY, 2))
        const distance2 = Math.sqrt(Math.pow(sourceX - targetX, 2) + Math.pow(sourceY - targetY, 2))

        // If `this.bend` is true, use Bézier curves
        if (this.bend) {
            // Control points for the Bézier curve
            const controlX1 = bendX
            const controlY1 = sourceY
            const controlX2 = bendX
            const controlY2 = targetY

            // Move to the source point
            ctx.moveTo(sourceX, sourceY)

            // Draw the Bézier curve to the target
            ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, targetX, targetY)

            ctx.stroke()
        } else {
            // First, draw horizontal line to bend point
            ctx.moveTo(sourceX, sourceY)
            ctx.lineTo(bendX, sourceY)

            // Check if the distance is greater than 100 before drawing the vertical and target lines
            if (distance >= 200) {
                // Draw the vertical line to the bend point
                ctx.lineTo(bendX, bendY)
            }

            // Draw the line to the target
            ctx.lineTo(targetX, targetY)

            ctx.stroke()
        }

        // Draw cardinality label in the middle of the line
        ctx.fillText('1-N', (sourceX + targetX) / 2, (sourceY + targetY) / 2 - 10)
    }

    doneDrag(table: Table, event: CdkDragEnd) {
        table.dragPosition.x += event.distance.x
        table.dragPosition.y += event.distance.y

        if (table.dragPosition.x < 0) {
            table.dragPosition.x = 0
        }

        if (table.dragPosition.y < 0) {
            table.dragPosition.y = 0
        }

        this.redraw()
        this.data.saveState()
    }

    ngOnInit(): void {
        this.serial = GuiEditorComponent.discoverSerial(this.data.schemas)
        // this.attributeForm.controls.Type.valueChanges.subscribe((t) => {
        //   if (t === AttrType.REFERENCE) {
        //     this.handleReferenceAttr();
        //   }
        // });

        /**
         *
         * Trigger detection again on default value if the type changed is ref by
         *
         */
        this.attributeForm.controls.Type.valueChanges.subscribe(() => {
            this.attributeForm.controls.Default.setValue(this.attributeForm.controls.Default.value)
            this.cdr.detectChanges()
        })

        this.attributeForm.controls.ReferenceTo.addValidators(this.validReference())
        this.attributeForm.controls.Default.addValidators(this.validDefault())
    }

    static discoverSerial(schemas: Schema[]): number {
        let largest = 1
        for (const s of schemas) {
            if (s.ID > largest) {
                largest = s.ID
            }
            for (const t of s.Tables) {
                if (t.ID > largest) {
                    largest = t.ID
                }
                for (const a of t.Attributes) {
                    if (a.ID > largest) {
                        largest = a.ID
                    }
                }
            }
        }
        return largest + 1
    }

    doShowModalSchema(s?: Schema) {
        this.showModalSchema = true
        this.cdr.detectChanges()
        if (this.schemaNameRef) {
            this.schemaNameRef.nativeElement.focus()
        }
        this.selectedSchema = s || null
        if (!s) {
            this.schemaForm.reset()
            return
        }
        this.setSchemaForm(s)
    }
    private setSchemaForm(s: Schema) {
        this.schemaForm.reset()
        this.schemaForm.controls.Name.setValue(s.Name)
        this.cdr.detectChanges()
    }

    doShowModalTable(s: Schema, t?: Table) {
        this.showModalTable = true
        this.cdr.detectChanges()
        if (this.tableNameRef) {
            this.tableNameRef.nativeElement.focus()
        } else {
            console.log('nothing to focus on')
        }
        this.selectedSchema = s
        this.selectedTable = t || null
        if (!t) {
            this.tableForm.reset()
            return
        }
        this.setTableForm(t)
    }
    private setTableForm(t: Table) {
        this.tableForm.reset()
        this.tableForm.controls.Name.setValue(t.Name)
        this.cdr.detectChanges()
    }

    doShowModalAttribute(s: Schema, t: Table, a?: Attribute) {
        this.showModalAttribute = true
        this.cdr.detectChanges()
        if (this.attrNameRef) {
            this.attrNameRef.nativeElement.focus()
        }
        this.selectedSchema = s
        this.selectedTable = t
        this.selectedAttribute = a || null
        if (!a) {
            this.attributeForm.reset()
            this.showSmartAttributes = true
            return
        }
        this.setAttributeForm(a)
    }

    private setAttributeForm(a: Attribute) {
        this.attributeForm.reset()

        this.showAttrOptions = a.Option !== undefined
        this.showAttrValidation = a.Validation !== undefined

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

    clickDelAttribute() {
        const t = this.selectedTable
        if (!t) {
            return
        }
        const a = this.selectedAttribute
        if (!a) {
            return
        }
        const i = t.Attributes.findIndex(e => e.ID === a.ID)
        if (i === -1) {
            return
        }
        t.Attributes.splice(i, 1)
        this.showModalAttribute = false
        this.data.ReloadAndSave()
    }

    clickSaveAttribute() {
        if (!this.selectedTable) return
        if (!this.attributeForm.valid) return
        const sa = this.selectedAttribute
        const c = this.attributeForm.controls
        if (sa) {
            sa.Name = c.Name.value!.trim()
            sa.Type = c.Type.value!

            setRef: if (this.isReference) {
                if (!c.ReferenceTo.value) {
                    break setRef
                }
                sa.RefTo = c.ReferenceTo.value
            }

            if (this.showAttrOptions) {
                if (!sa.Option) {
                    sa.Option = {}
                }
                if (c.PrimaryKey.value !== null) {
                    sa.Option.PrimaryKey = c.PrimaryKey.value
                } else {
                    sa.Option.PrimaryKey = undefined
                }
                if (c.Unique.value !== null) {
                    sa.Option.Unique = c.Unique.value
                } else {
                    sa.Option.Unique = undefined
                }
                if (c.Default.value !== null) {
                    sa.Option.Default = c.Default.value
                } else {
                    sa.Option.Default = undefined
                }
                if (c.SystemField.value !== null) {
                    sa.Option.SystemField = c.SystemField.value
                } else {
                    sa.Option.SystemField = undefined
                }
            } else {
                sa.Option = undefined
            }

            if (this.showAttrValidation) {
                if (!sa.Validation) {
                    sa.Validation = {}
                }

                const minMaxRelevant = new MinMaxRelevantPipe().transform(c.Type.value)
                if (c.Min.value !== null && minMaxRelevant) {
                    sa.Validation.Min = c.Min.value
                } else {
                    sa.Validation.Min = undefined
                }
                if (c.Max.value !== null && minMaxRelevant) {
                    sa.Validation.Max = c.Max.value
                } else {
                    sa.Validation.Max = undefined
                }

                if (c.Required.value !== null) {
                    sa.Validation.Required = c.Required.value
                } else {
                    sa.Validation.Required = undefined
                }
            } else {
                sa.Validation = undefined
            }
        } else {
            const newAttr = new Attribute(this.serial, c.Name.value!, c.Type.value!, this.selectedTable)

            setRef: if (this.isReference) {
                if (!c.ReferenceTo.value) {
                    break setRef
                }
                newAttr.RefTo = c.ReferenceTo.value
            }

            if (this.showAttrOptions) {
                newAttr['Option'] = {
                    Default: c.Default.value!,
                    Unique: c.Unique.value!,
                    PrimaryKey: c.PrimaryKey.value!
                }
            }
            if (this.showAttrValidation) {
                newAttr['Validation'] = {
                    Min: c.Min.value!,
                    Max: c.Max.value!,
                    Required: c.Required.value!
                }
            }
            this.selectedTable.Attributes.push(newAttr)
            this.serial += 1
        }
        this.attributeForm.reset()
        this.data.ReloadAndSave()
    }

    clickDelTable() {
        const s = this.selectedSchema
        if (!s) {
            return
        }
        const t = this.selectedTable
        if (!t) {
            return
        }
        const i = s.Tables.findIndex(e => e.ID === t.ID)
        if (i === -1) {
            return
        }
        s.Tables.splice(i, 1)
        this.showModalTable = false
        this.data.ReloadAndSave()
    }
    clickSaveTable() {
        if (!this.selectedSchema) return
        if (!this.tableForm.valid) return
        const st = this.selectedTable
        const c = this.tableForm.controls
        if (st) {
            st.Name = c.Name.value!.trim()
        } else {
            const newTbl = new Table(this.serial, c.Name.value!, this.selectedSchema)
            this.selectedSchema.Tables.push(newTbl)
            this.serial += 1
        }
        this.schemaForm.reset()
        this.data.ReloadAndSave()
    }

    clickDelSchema() {
        const s = this.selectedSchema
        if (!s) {
            return
        }
        const i = this.data.schemas.findIndex(e => e.ID === s.ID)
        if (i === -1) {
            return
        }
        this.showModalSchema = false
        this.data.schemas.splice(i, 1)
        this.data.ReloadAndSave()
    }

    clickSaveSchema() {
        if (!this.schemaForm.valid) return
        const ss = this.selectedSchema
        const c = this.schemaForm.controls
        if (ss) {
            ss.Name = c.Name.value!.trim()
        } else {
            this.data.schemas.push({
                ID: this.serial,
                Name: c.Name.value!,
                Tables: []
            })
            this.serial += 1
        }
        this.schemaForm.reset()
        this.data.ReloadAndSave()
    }

    get smartSuggestions(): Attribute[] {
        const t = this.selectedTable
        if (!t) return []
        const attrNames = t.Attributes.map(e => e.Name.toLowerCase())
        const answer = []
        for (const e of this.presetAttributes) {
            if (attrNames.includes(e.Name.toLowerCase())) {
                continue
            }
            answer.push(JSON.parse(JSON.stringify(e)))
        }
        return answer
    }

    clickSmartSuggestion(a: Attribute) {
        this.setAttributeForm(a)
        this.cdr.detectChanges()
    }

    clearSelections() {
        this.selectedSchema = null
        this.selectedTable = null
        this.selectedAttribute = null
    }

    get referenceOptions(): Table[] {
        const answer: Table[] = []
        // if (!this.selectedTable) {
        //   return [];
        // }
        if (!this.isReference) {
            return []
        }

        for (const s of this.data.schemas) {
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
