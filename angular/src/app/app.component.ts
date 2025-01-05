import { Component, OnInit } from '@angular/core';
import {
  AppComplexityMode,
  AppGeneratorMode,
  AppMode,
  NotificationKind,
  NotificationLife,
} from './structure';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GuiEditorComponent } from './gui-editor/gui-editor.component';
import { DataService } from './services/data.service';
import { ModalComponent } from './modal/modal.component';
import { CodeOutputComponent } from './code-output/code-output.component';
import { NotificationService } from './services/notification.service';
import YAML from 'yaml';
import { Notification } from './structure';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    GuiEditorComponent,
    ModalComponent,
    CodeOutputComponent,
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
      name: 'Postgres: Tables',
      value: AppGeneratorMode.Postgres,
    },
    {
      name: 'Postgres: ƒ',
      value: AppGeneratorMode.PostgresFunctions,
    },
    {
      name: 'SQLite: Tables',
      value: AppGeneratorMode.SQLiteTables,
    },
    {
      name: 'T-SQL: Tables',
      value: AppGeneratorMode.TSQLTables,
    },
    {
      name: ' T-SQL: Stored Procedures',
      value: AppGeneratorMode.TSQLStoredProcedures,
    },
    {
      name: 'Go: Structs and ƒ',
      value: AppGeneratorMode.GoStructsAndFns,
    },
    {
      name: 'TypeScript: Types and ƒ',
      value: AppGeneratorMode.TSTypesAndFns,
    },
    {
      name: 'TypeScript: Classes',
      value: AppGeneratorMode.TSClasses,
    },
    {
      name: 'JavaScript: Classes',
      value: AppGeneratorMode.JSClasses,
    },
    {
      name: 'Angular: Reactive Form',
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

  copyConfig() {
    let str = '';
    if (this.data.app.mode === AppMode.JSON) {
      str = JSON.stringify(this.data.schemasConfig, null, 4);
    } else if (this.data.app.mode === AppMode.YAML) {
      str = YAML.stringify(this.data.schemasConfig);
    }
    navigator.clipboard.writeText(str);
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
