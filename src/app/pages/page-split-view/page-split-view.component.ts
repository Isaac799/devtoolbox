import {Component, ElementRef, HostListener, inject, OnInit, ViewChild} from '@angular/core'
import {PageCodeOutputComponent} from '../page-code-output/page-code-output.component'
import {PageTextEditorComponent} from '../page-text-editor/page-text-editor.component'
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout'
import { Router } from '@angular/router'

@Component({
    selector: 'app-page-split-view',
    imports: [PageCodeOutputComponent, PageTextEditorComponent],
    templateUrl: './page-split-view.component.html',
    styleUrl: './page-split-view.component.scss'
})
export class PageSplitViewComponent implements OnInit {
    private readonly breakpointObserver = inject(BreakpointObserver)
    private readonly router = inject(Router)


    @ViewChild('divider') divider: ElementRef | undefined = undefined
    @ViewChild('leftPanel') leftPanel: ElementRef | undefined = undefined
    @ViewChild('rightPanel') rightPanel: ElementRef | undefined = undefined

    isDragging = false
    dividerPosition = 50 // Initial position in percentage (50% for the initial split)
    i = 0

    ngOnInit(): void {
      if (
        !this.breakpointObserver.isMatched(Breakpoints.Large) &&
        !this.breakpointObserver.isMatched(Breakpoints.XLarge) 
      ) {
        this.router.navigate([''])
      }
    }

    // Start dragging
    startDrag(event: MouseEvent): void {
        this.isDragging = true
        event.preventDefault()
    }

    // During dragging
    @HostListener('document:mousemove', ['$event'])
    drag(event: MouseEvent): void {
        this.i += 1
        if (this.i % 2 !== 0) return
        this.i = 0

        if (!this.divider) return
        if (!this.isDragging) return

        const rect = this.divider.nativeElement.parentElement.getBoundingClientRect()
        const newPosition = ((event.clientX - rect.left) / rect.width) * 100
        this.dividerPosition = Math.max(0, Math.min(100, newPosition))
    }

    // End dragging
    @HostListener('document:mouseup')
    stopDrag(): void {
        this.isDragging = false
    }
}
