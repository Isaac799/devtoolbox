import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import hljs from 'highlight.js';
import { AppGeneratorMode, AppMode, SchemaConfig } from '../structure';
import YAML from 'yaml';

@Component({
  selector: 'app-text-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
})
export class TextEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  editor = '';
  output = '';
  @ViewChild("textEditor") textEditor?: ElementRef<HTMLPreElement>;
  subscription: Subscription | null = null;

  constructor(public data: DataService) {}

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.data.schemasConfigChange.subscribe({
      next: (data) => {
        this.updateEditor(data);
      },
    });
  }

  ngAfterViewInit(): void {
    if (!this.textEditor?.nativeElement) {
      console.error('Missing this.editorText');
      return;
    }

    let ext = '';
    switch (this.data.app.mode) {
      case AppMode.JSON:
        ext = 'JSON';
        break;
      case AppMode.YAML:
        ext = 'YAML';
        break;
    }

    let code = hljs.highlight(this.output, { language: ext }).value;
    this.textEditor.nativeElement.innerHTML = code;
  }

  private updateEditor(data: Record<string, SchemaConfig>) {
    switch (this.data.app.mode) {
      case AppMode.JSON:
        {
          let txt = JSON.stringify(data, null, 2);
          this.editor = txt;

          if (this.textEditor?.nativeElement) {
            let code = hljs.highlight(txt, { language: 'JSON' }).value;
            this.textEditor.nativeElement.innerHTML = code;
          }
        }
        break;
      case AppMode.YAML:
        {
          let txt = YAML.stringify(data, null, 2);
          this.editor = txt;
          if (this.textEditor) {
            let code = hljs.highlight(txt, { language: 'YAML' }).value;
            this.textEditor.nativeElement.innerHTML = code;
          }
        }
        break;
    }
  }
}
