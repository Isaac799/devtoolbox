import {ElementRef, EventEmitter, Injectable} from '@angular/core'

@Injectable({
    providedIn: 'root'
})
export class TextEditorService {
    private readonly rawKey = 'devtoolboxRawTextInput'
    static readonly AttributeTypeCompact = 2
    static readonly AttributeOptionCompact = 3
    readonly doRender = new EventEmitter<void>()

    justCleaned = false
    focused = false
    caretPosition: {
        direction: 'forward' | 'backward' | 'none'
        start: number
        end: number
    } = {
        direction: 'none',
        start: 0,
        end: 0
    }

    fromMacro = false
    fromUndo = false
    pastFirstLoad = false
    saveUndoValue: string | null = null
    saveUndoDebounce: ReturnType<typeof setTimeout> | undefined = undefined

    private _textEditor: ElementRef<HTMLTextAreaElement> | null = null
    public get textEditorEl(): ElementRef<HTMLTextAreaElement> | null {
        return this._textEditor
    }
    public set textEditorEl(value: ElementRef<HTMLTextAreaElement> | null) {
        this._textEditor = value
        if (value) {
            this.populateEditor(value.nativeElement)
        }
    }

    private _textInput = ''
    public get textInput() {
        return this._textInput
    }
    public set textInput(value) {
        if (!this.fromUndo) {
            this.SaveToUndo(this._textInput)
        }
        this._textInput = value
        if (this.fromMacro && this.textEditorEl) {
            this._focus(this.textEditorEl.nativeElement)
        }
    }
    textInputUndoStack: string[] = []
    textInputRedoStack: string[] = []

    textEditorSyntaxAttributeOptions = [
        {name: 'Expanded', value: 'Expanded'},
        {name: 'Compact', value: 'Compact'}
    ]
    textEditorSyntaxOptionsOptions = [
        {name: 'Expanded', value: 'Expanded'},
        {name: 'Compact', value: 'Compact'}
    ]

    private _focus(el: HTMLTextAreaElement) {
        el.focus()
        setTimeout(() => {
            el.setSelectionRange(this.caretPosition.start, this.caretPosition.end, this.caretPosition.direction)
        }, 0)
    }

    private _saveFocus(el: HTMLTextAreaElement) {
        this.caretPosition.start = el.selectionStart
        this.caretPosition.end = el.selectionEnd
        this.caretPosition.direction = el.selectionDirection
    }

    private populateEditor(el: HTMLTextAreaElement) {
        this._focus(el)

        el.addEventListener('keydown', (ev: KeyboardEvent) => {
            const isCtrlPressed = ev.ctrlKey || ev.metaKey

            if (isCtrlPressed && ev.key === 'z') {
                if (ev.shiftKey) {
                    // Ctrl + Shift + Z → Redo
                    this.Redo()
                } else {
                    // Ctrl + Z → Undo
                    this.Undo()
                }
            } else if (ev.key === 'y') {
                // Ctrl + Y → Redo (alternative)
                this.Redo()
            }

            if (!(ev.target instanceof HTMLTextAreaElement)) return
            this._saveFocus(ev.target)
        })

        el.addEventListener('mouseup', (ev: MouseEvent) => {
            if (!(ev.target instanceof HTMLTextAreaElement)) return
            this._saveFocus(ev.target)
        })
    }

    SaveToUndo(x: string) {
        if (!this.pastFirstLoad) {
            this.pastFirstLoad = true
            return
        }

        if (this.saveUndoValue === null) {
            this.saveUndoValue = x
        }

        clearTimeout(this.saveUndoDebounce)
        this.saveUndoDebounce = setTimeout(() => {
            if (!this.saveUndoValue) {
                return
            }
            this.textInputUndoStack.push(this.saveUndoValue)
            this.saveUndoValue = null
            this.textInputRedoStack = []
        }, 300)
    }

    LoadLastTextEdit() {
        const rawTextInput = localStorage.getItem(this.rawKey)
        if (!rawTextInput) return
        this.textInput = rawTextInput
    }

    SaveLastTextEdit() {
        localStorage.setItem(this.rawKey, this.textInput)
    }

    Undo() {
        this.fromUndo = true
        this.textInputRedoStack.push(this.textInput)
        this.textInput = this.textInputUndoStack.pop() || ''
        this.fromUndo = false
        this.doRender.next()
    }

    Redo() {
        this.textInputUndoStack.push(this.textInput)
        this.textInput = this.textInputRedoStack.pop() || ''
        this.doRender.next()
    }
}
