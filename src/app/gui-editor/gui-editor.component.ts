import {ChangeDetectorRef, Component, ElementRef, ViewChild, AfterViewInit, inject} from '@angular/core'
import {DataService} from '../services/data.service'
import {Schema, Table, Attribute} from '../structure'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {CommonModule} from '@angular/common'
import {NotificationService} from '../services/notification.service'
import {CdkDrag, CdkDragEnd, DragDropModule} from '@angular/cdk/drag-drop'
import {MatDialog} from '@angular/material/dialog'
import {DialogAttributeComponent} from '../dialogs/dialog-attribute/dialog-attribute.component'
import {MatButtonModule} from '@angular/material/button'

@Component({
    selector: 'app-gui-editor',
    imports: [FormsModule, CommonModule, ReactiveFormsModule, DragDropModule, CdkDrag, MatButtonModule],
    templateUrl: './gui-editor.component.html',
    styleUrl: './gui-editor.component.scss'
})
export class GuiEditorComponent implements AfterViewInit {
    hoveredTable: Table | null = null
    hoveredSchema: Schema | null = null
    private matDialog = inject(MatDialog)

    bend = false
    showMoves = false
    readonly showMovesTimeoutMS: number = 500

    private _serial = 0
    private get serial() {
        return this._serial
    }
    private set serial(value) {
        this._serial = value
    }

    @ViewChild('canvas') canvasRef: ElementRef<HTMLCanvasElement> | undefined = undefined

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
        const offsetGrow = 12

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
            bendX -= offset
        } else {
            bendX += offset
        }
        if (bendY > attrSrc.y) {
            bendY -= offset
        } else {
            bendY += offset
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

    doShowModalAttribute(s: Schema, t: Table, a?: Attribute) {
        const dialogRef = this.matDialog.open(DialogAttributeComponent, {
            data: {
                a,
                t,
                s
            }
        })

        dialogRef.afterClosed().subscribe(() => {
            this.data.ReloadAndSave()
        })
    }
}
