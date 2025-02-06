import {Component, ElementRef, ViewChild, AfterViewInit, inject, OnInit, OnDestroy, Renderer2} from '@angular/core'
import {DataService} from '../../services/data.service'
import {Schema, Table, Attribute} from '../../structure'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {CommonModule} from '@angular/common'
import {CdkDrag, CdkDragEnd, DragDropModule} from '@angular/cdk/drag-drop'
import {MatDialog} from '@angular/material/dialog'
import {DialogAttributeComponent} from '../../dialogs/dialog-attribute/dialog-attribute.component'
import {MatButtonModule} from '@angular/material/button'
import {MatIconModule} from '@angular/material/icon'
import {MatCardModule} from '@angular/material/card'
import {SideBarEditorComponent} from '../../components/side-bar-editor/side-bar-editor.component'
import {MatChipsModule} from '@angular/material/chips'
import {SideBarService} from '../../services/side-bar.service'
import {MatListModule} from '@angular/material/list'
import {AppService} from '../../services/app.service'
import { PrettyTypePipe } from "../../pipes/pretty-type.pipe";

@Component({
    selector: 'app-page-gui-editor',
    imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    DragDropModule,
    CdkDrag,
    MatButtonModule,
    MatIconModule,
    SideBarEditorComponent,
    MatChipsModule,
    MatListModule,
    PrettyTypePipe
],
    templateUrl: './page-gui-editor.component.html',
    styleUrl: './page-gui-editor.component.scss'
})
export class PageGuiEditorComponent implements AfterViewInit, OnInit, OnDestroy {
    private matDialog = inject(MatDialog)
    readonly sideBarService = inject(SideBarService)
    private readonly appService = inject(AppService)
    readonly dataService = inject(DataService)
    private readonly renderer = inject(Renderer2)

    bend = false
    resizeDebounce: ReturnType<typeof setTimeout> | undefined = undefined

    @ViewChild('canvas') canvasRef: ElementRef<HTMLCanvasElement> | undefined = undefined
    @ViewChild('rootEditor') rootEditor: ElementRef<HTMLDivElement> | undefined = undefined

    ngOnInit(): void {
        // Resize the canvas when the component is initialized
        this.resizeCanvas()

        // Listen to the window resize event
        this.renderer.listen('window', 'resize', () => {
            this.resizeCanvas()
        })
    }

    ngOnDestroy(): void {
        // this.renderer.listen('window', 'resize', () => {}).remove()
    }

    resizeCanvas(): void {
        clearTimeout(this.resizeDebounce)
        this.resizeDebounce = setTimeout(() => {
            if (!this.canvasRef) {
                return
            }
            if (!this.rootEditor) {
                return
            }

            const rootSize = this.rootEditor.nativeElement.getBoundingClientRect()
            this.canvasRef.nativeElement.width = rootSize.width
            this.canvasRef.nativeElement.height = rootSize.height
            this.redraw()
        }, 300)
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.redraw()
        }, 300)
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

        for (const s of this.dataService.schemas) {
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
        this.appService.Save()
    }

    doShowModalAttribute(s: Schema, t: Table, a?: Attribute) {
        const dialogRef = this.matDialog.open(DialogAttributeComponent, {
            data: {
                a,
                t,
                s,
                ss: this.dataService.schemas
            }
        })

        dialogRef.afterClosed().subscribe(() => {
            this.appService.RefreshOutput()
        })
    }
}
