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
import {
  AppMode,
  Notification,
  NotificationKind,
  NotificationLife,
  SchemaConfig,
} from '../structure';
import YAML from 'yaml';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-text-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
})
export class TextEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('textViewer') textViewer?: ElementRef<HTMLPreElement>;
  subscription: Subscription | null = null;
  debounceReloadTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    public data: DataService,
    private notification: NotificationService
  ) {}

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
    let ext = '';
    switch (this.data.app.mode) {
      case AppMode.JSON:
        ext = 'JSON';
        break;
      case AppMode.YAML:
        ext = 'YAML';
        break;
    }

    // let code = hljs.highlight(this.data.editor, { language: ext }).value;

    // if (!this.textViewer?.nativeElement) {
    //   console.error('Missing el');
    //   return;
    // }

    // this.textViewer.nativeElement.innerHTML = code;
  }

  debounceReload() {
    clearTimeout(this.debounceReloadTimeout || undefined);
    this.debounceReloadTimeout = setTimeout(() => {
      this.data.ReloadAndSave();
    }, 500);
  }

  private updateEditor(data: Record<string, SchemaConfig>) {
    switch (this.data.app.mode) {
      case AppMode.JSON:
        {
          let txt = JSON.stringify(data, null, 2);
          this.data.editor = txt;

          if (this.textViewer?.nativeElement) {
            let code = hljs.highlight(txt, { language: 'JSON' }).value;
            this.textViewer.nativeElement.innerHTML = code;
          }
        }
        break;
      case AppMode.YAML:
        {
          let txt = YAML.stringify(data, null, 2);
          this.data.editor = txt;

          if (this.textViewer?.nativeElement) {
            let code = hljs.highlight(txt, { language: 'YAML' }).value;
            this.textViewer.nativeElement.innerHTML = code;
          }
        }
        break;
    }
  }

  copy() {
    navigator.clipboard.writeText(this.data.editor);
    this.notification.Add(
      new Notification(
        'Copied',
        'The config was copied to your clipboard.',
        NotificationKind.Info,
        NotificationLife.Short
      )
    );
  }
}
