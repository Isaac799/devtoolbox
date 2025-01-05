import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DataService } from '../services/data.service';
import {
  AppGeneratorMode,
  Func,
  Notification,
  NotificationKind,
  NotificationLife,
} from '../structure';
import { Subscription } from 'rxjs';
import { SchemasToPostgreSQL } from './generators/pgsql.tables';
import { SchemasToGoStructs } from './generators/go';
import { SchemasToTsStructs } from './generators/ts';
import { SchemasToSqlFuncs } from './generators/pgsql.functions';
import hljs from 'highlight.js';
import { NotificationService } from '../services/notification.service';
import { SchemasToAngularFormControls } from './generators/angular.form.controls';
import { SchemasToTablesForTSQL } from './generators/tsql.tables';
import { SchemasToTSQLStoredProcedures } from './generators/tsql.stored.procedures';
import { SchemasToTsClasses } from './generators/ts.class';

@Component({
  selector: 'app-code-output',
  imports: [],
  templateUrl: './code-output.component.html',
  styleUrl: './code-output.component.scss',
})
export class CodeOutputComponent implements OnInit, OnDestroy, AfterViewInit {
  output = '';
  subscription: Subscription | null = null;
  @ViewChild('codeOutput') codeOutput?: ElementRef<HTMLPreElement>;

  constructor(
    public data: DataService,
    private notification: NotificationService
  ) {}
  ngAfterViewInit(): void {
    this.subscription = this.data.schemasChange.subscribe((schemas) => {
      let ext = '';
      switch (this.data.app.generatorMode) {
        case AppGeneratorMode.Postgres:
          this.output = SchemasToPostgreSQL(schemas);
          ext = 'SQL';
          break;
        case AppGeneratorMode.Go:
          this.output = SchemasToGoStructs(schemas);
          ext = 'GO';
          break;
        case AppGeneratorMode.TS:
          this.output = SchemasToTsStructs(schemas);
          ext = 'TS';
          break;
        case AppGeneratorMode.TSClasses:
          this.output = SchemasToTsClasses(schemas);
          ext = 'TS';
          break;
        case AppGeneratorMode.PostgresFunctions:
          this.output = SchemasToSqlFuncs(schemas);
          ext = 'SQL';
          break;
        case AppGeneratorMode.AngularFormControl:
          this.output = SchemasToAngularFormControls(schemas);
          ext = 'TS';
          break;
        case AppGeneratorMode.TSQLTables:
          this.output = SchemasToTablesForTSQL(schemas);
          ext = 'SQL';
          break;
        case AppGeneratorMode.TSQLStoredProcedures:
          this.output = SchemasToTSQLStoredProcedures(schemas);
          ext = 'SQL';
          break;
      }

      if (!this.codeOutput?.nativeElement) {
        console.error('Missing this.codeGeneratorViewHtml');
        return;
      }
      let code = hljs.highlight(this.output, { language: ext }).value;
      this.codeOutput.nativeElement.innerHTML = code;
    });
  }

  ngOnInit(): void {
    this.data.Reload();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  copy() {
    navigator.clipboard.writeText(this.output);
    this.notification.Add(
      new Notification(
        'Copied',
        'The code was copied to your clipboard.',
        NotificationKind.Info,
        NotificationLife.Short
      )
    );
  }
}
