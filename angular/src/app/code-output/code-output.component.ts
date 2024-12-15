import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { alignKeywords, alignKeyword } from '../formatting';
import { Schema, AttrType, AppGeneratorMode } from '../structure';
import { TAB } from '../constants';
import { Subscription } from 'rxjs';

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
          this.output = CodeOutputComponent.schemasToPostgreSQL(schemas);
          break;
        case AppGeneratorMode.Go:
          break;
        case AppGeneratorMode.TS:
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

  private static schemasToPostgreSQL(schemas: Schema[]) {
    let drops: string[] = [];
    let createTableLines: string[] = [];
    for (const s of schemas) {
      drops.push(`DROP SCHEMA IF EXISTS ${s.Name};`);
      createTableLines.push(`CREATE SCHEMA IF NOT EXISTS ${s.Name};`);
      for (const t of s.Tables) {
        let attrs: string[] = [];
        createTableLines.push(`CREATE TABLE IF NOT EXISTS ${t.Name} (`);
        drops.push(`DROP TABLE IF EXISTS ${t.Name};`);
        for (const a of t.Attributes) {
          let type = '';
          if ([AttrType.VARCHAR].includes(a.Type)) {
            let max = 15;
            if (!a.Validation || !a.Validation.Max) {
              console.warn(`missing max validation on "${a.Name}"`);
            } else {
              max = a.Validation.Max;
            }
            type = [a.Type, `(${max || '15'})`].join('');
          } else {
            type = a.Type;
          }

          let attrLine = [`${a.Name} ${type}`];

          if (a.Options?.Default) {
            let def = a.Options.Default;
            if ([AttrType.VARCHAR, AttrType.CHAR].includes(a.Type)) {
              def = `'${def.replace("'", "''")}'`;
            }
            // todo better default handling
            attrLine.push(`DEFAULT ${def}`);
          }
          if (a.Validation?.Required) {
            attrLine.push(`NOT NULL`);
          }
          attrs.push(attrLine.join(' '));
        }

        attrs = alignKeywords(attrs, Object.values(AttrType));

        let endThings: string[] = [];

        let pks = t.Attributes.filter((e) => e.Options?.PrimaryKey).map(
          (e) => e.Name
        );
        let pksStr = `PRIMARY KEY ( ${pks.join(', ')} )`;
        endThings.push(pksStr);

        let uniques = t.Attributes.filter((e) => e.Options?.Unique).map(
          (e) => e.Name
        );
        for (const e of uniques) {
          let uniquesStr = `UNIQUE ( ${e} )`;
          endThings.push(uniquesStr);
        }
        endThings = alignKeyword(endThings, '(');
        // let uniquesStr = `UNIQUE ( ${uniques.join(', ')} )`;

        attrs[0] = `${TAB}${attrs[0]}`;
        createTableLines.push([...attrs, ...endThings].join(`,\n${TAB}`));

        createTableLines.push(');');
      }
    }
    drops = drops.reverse();
    let all = ['BEGIN;', '', ...drops, '', ...createTableLines, '', 'COMMIT;'];
    let str = all.join('\n');
    return str;
  }

  schemasToGoStructs(schemas: Schema[]) {
    let lines: string[] = [];
    for (const s of schemas) {
      for (const t of s.Tables) {
        for (const a of t.Attributes) {
        }
      }
    }
    let str = lines.join('\n');
    return str;
  }
}
