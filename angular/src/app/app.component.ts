import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AppComplexityMode, AppGeneratorMode, AppMode } from './structure';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GuiEditorComponent } from './gui-editor/gui-editor.component';
import { DataService } from './services/data.service';
import { ModalComponent } from './modal/modal.component';
import { CodeOutputComponent } from './code-output/code-output.component';
import { TextEditorComponent } from './text-editor/text-editor.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    GuiEditorComponent,
    ModalComponent,
    CodeOutputComponent,
    TextEditorComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  readonly title = 'devtoolbox';
  showSettingsModal: boolean = false;

  modeOptions = [
    {
      name: 'JSON',
      value: AppMode.JSON,
    },
    {
      name: 'YAML',
      value: AppMode.YAML,
    },
  ];

  complexityOptions = [
    {
      name: 'Easy Mode',
      value: AppComplexityMode.Simple,
    },
    {
      name: 'Advanced Mode',
      value: AppComplexityMode.Advanced,
    },
  ];

  generatorModeOptions = [
    {
      name: 'PostgreSQL',
      value: AppGeneratorMode.Postgres,
    },
    {
      name: 'Go',
      value: AppGeneratorMode.Go,
    },
    {
      name: 'Typescript',
      value: AppGeneratorMode.TS,
    },
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    public data: DataService,
  ) {}

  ngOnInit(): void {
    this.data.Initialize();
    this.data.Reload();
  }
}
