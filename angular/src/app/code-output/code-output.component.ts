import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { AppGeneratorMode } from '../structure';
import { Subscription } from 'rxjs';
import { SchemasToPostgreSQL } from './generators/pgsql';
import { SchemasToGoStructs } from './generators/go';
import { SchemasToTsStructs } from './generators/ts';

@Component({
  selector: 'app-code-output',
  imports: [],
  templateUrl: './code-output.component.html',
  styleUrl: './code-output.component.scss',
})
export class CodeOutputComponent implements OnInit, OnDestroy {
  output = '';
  subscription: Subscription | null = null;

  constructor(public data: DataService) {}

  ngOnInit(): void {
    this.subscription = this.data.regenerateOutput.subscribe((schemas) => {
      switch (this.data.app.generatorMode) {
        case AppGeneratorMode.Postgres:
          this.output = SchemasToPostgreSQL(schemas);
          break;
        case AppGeneratorMode.Go:
          this.output = SchemasToGoStructs(schemas);
          break;
        case AppGeneratorMode.TS:
          this.output = SchemasToTsStructs(schemas);
          break;
      }
    });

    this.data.Reload();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
