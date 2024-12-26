import { Component, OnInit } from '@angular/core';
import { AppComplexityMode, AppGeneratorMode, AppMode } from './structure';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GuiEditorComponent } from './gui-editor/gui-editor.component';
import { DataService } from './services/data.service';
import { ModalComponent } from './modal/modal.component';
import { CodeOutputComponent } from './code-output/code-output.component';
import { TextEditorComponent } from './text-editor/text-editor.component';
import { NotificationService } from './services/notification.service';

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
      name: 'PgSQL: Tables',
      value: AppGeneratorMode.Postgres,
    },
    {
      name: 'PgSQL: Functions',
      value: AppGeneratorMode.PostgresFunctions,
    },
    {
      name: 'TSQL: Tables',
      value: AppGeneratorMode.TSQLTables,
    },
    {
      name: 'TSQL: Stored Procedures',
      value: AppGeneratorMode.TSQLStoredProcedures,
    },
    {
      name: 'GO structs & new fns',
      value: AppGeneratorMode.Go,
    },
    {
      name: 'TS types & new fns',
      value: AppGeneratorMode.TS,
    },
    {
      name: 'Angular reactive form',
      value: AppGeneratorMode.AngularFormControl,
    },
  ];

  constructor(
    public data: DataService,
    public notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.data.Initialize();
  }
}
