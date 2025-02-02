import {Injectable} from '@angular/core'

@Injectable({
    providedIn: 'root'
})
export class TextEditorService {
    private readonly rawTextInput = 'devtoolboxRawextInput'

    pastFirstLoad = false
    fromUndo = false
    saveUndoValue: string | null = null
    saveUndoDebounce: ReturnType<typeof setTimeout> | undefined = undefined

    private _textInput = ''
    public get textInput() {
        return this._textInput
    }
    public set textInput(value) {
        if (!this.fromUndo) {
            this.SaveToUndo(this._textInput)
        }
        this._textInput = value
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
        }, 500)
    }

    loadLastTextEdit() {
        const rawTextInput = localStorage.getItem(this.rawTextInput)
        if (!rawTextInput) return
        this.textInput = rawTextInput
    }

    saveLastTextEdit() {
        localStorage.setItem(this.rawTextInput, this.textInput)
    }

    Undo() {
        this.fromUndo = true
        this.textInputRedoStack.push(this.textInput)
        this.textInput = this.textInputUndoStack.pop() || ''
        this.fromUndo = false
    }

    Redo() {
        this.textInputUndoStack.push(this.textInput)
        this.textInput = this.textInputRedoStack.pop() || ''
    }
}
