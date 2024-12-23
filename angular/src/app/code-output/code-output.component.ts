import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DataService } from '../services/data.service';
import { AppGeneratorMode } from '../structure';
import { Subscription } from 'rxjs';
import { SchemasToPostgreSQL } from './generators/pgsql.tables';
import { SchemasToGoStructs } from './generators/go';
import { SchemasToTsStructs } from './generators/ts';
import { SchemasToSqlFuncs } from './generators/pgsql.functions';
import hljs from 'highlight.js';

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

  constructor(public data: DataService) {}
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
        case AppGeneratorMode.PostgresFunctions:
          this.output = SchemasToSqlFuncs(schemas);
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
}
