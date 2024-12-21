import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { alignKeywords, alignKeyword } from '../formatting';
import {
  Schema,
  AttrType,
  AppGeneratorMode,
  Table,
  Attribute,
  AttributeNameWithTable,
  TableFullName,
  AttributeNameWithSchemaAndTable,
} from '../structure';
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
          this.output = this.schemasToPostgreSQL(schemas);
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

  private schemasToPostgreSQL(schemas: Schema[]) {
    let drops: string[] = [];
    let createTableLines: string[] = [];
    for (const s of schemas) {
      drops.push(`DROP SCHEMA IF EXISTS ${s.Name};`);
      createTableLines.push(`CREATE SCHEMA IF NOT EXISTS ${s.Name};`);
      for (const t of s.Tables) {
        drops.push(`DROP TABLE IF EXISTS ${t.Name};`);
        createTableLines.push(`CREATE TABLE IF NOT EXISTS ${t.Name} (`);
        let attrs: string[] = this.generateAttributesForTable(t);

        let endThings: string[] = this.generateTableEndParts(t);
        let indexes: string[] = this.generateTableIndexes(t);
        // let uniquesStr = `UNIQUE ( ${uniques.join(', ')} )`;

        if (attrs.length >= 1) {
          attrs[0] = `${TAB}${attrs[0]}`;
        }
        createTableLines.push([...attrs, ...endThings].join(`,\n${TAB}`));

        createTableLines.push(');');

        createTableLines = createTableLines.concat(indexes);
      }
    }
    drops = drops.reverse();
    let all = ['BEGIN;', '', ...drops, '', ...createTableLines, '', 'COMMIT;'];
    let str = all.join('\n');
    return str;
  }

  private generateTableEndParts(t: Table) {
    let endThings: string[] = [];

    let pks = t.Attributes.filter((e) => e.Option?.PrimaryKey).map(
      (e) => e.Name
    );
    if (pks.length > 0) {
      let pksStr = `PRIMARY KEY ( ${pks.join(', ')} )`;
      endThings.push(pksStr);
    }

    let uniques = t.Attributes.filter((e) => e.Option?.Unique).map(
      (e) => e.Name
    );
    if (uniques.length > 0) {
      for (const e of uniques) {
        let uniquesStr = `UNIQUE ( ${e} )`;
        endThings.push(uniquesStr);
      }
    }

    let refs = t.Attributes.filter((e) => e.RefTo);
    if (refs.length > 0) {
      for (const e of refs) {
        let r = e.RefTo!;
        let rPks = r.Attributes.filter((e) => e.Option?.PrimaryKey);
        for (const rPk of rPks) {
          let rStr = `FOREIGN KEY ( ${e.Name} ) REFERENCES ${TableFullName(
            r
          )} ( ${rPk.Name} ) ON DELETE CASCADE`;
          endThings.push(rStr);
        }
      }
    }

    endThings = alignKeyword(endThings, '(');
    return endThings;
  }

  private generateTableIndexes(t: Table) {
    let endThings: string[] = [];

    let refs = t.Attributes.filter((e) => e.RefTo);
    if (refs.length > 0) {
      for (const e of refs) {
        let r = e.RefTo!;
        let rPks = r.Attributes.filter((e) => e.Option?.PrimaryKey);
        for (const rPk of rPks) {
          let rStr = `CREATE INDEX idx_${AttributeNameWithSchemaAndTable(
            rPk
          ).replaceAll('.', '_')} ON ${TableFullName(r)} ( ${rPk.Name} );`;
          endThings.push(rStr);
        }
      }
    }

    endThings = alignKeyword(endThings, 'ON');
    return endThings;
  }

  private generateAttributesForTable(t: Table, beingReferences?: Attribute) {
    let attrs: string[] = [];
    for (const a of t.Attributes) {
      if (beingReferences) {
        if (!a.Option?.PrimaryKey) {
          continue;
        }
      }
      let name = beingReferences ? `${beingReferences.Name}_${a.Name}` : a.Name;
      let type = '';
      if ([AttrType.VARCHAR].includes(a.Type)) {
        let max = 15;
        if (!a.Validation || !a.Validation.Max) {
          console.warn(`missing max validation on "${name}"`);
        } else {
          max = a.Validation.Max;
        }
        type = [a.Type, `(${max || '15'})`].join('');
      } else if (a.Type === AttrType.REFERENCE) {
        if (beingReferences) {
          // prevents endless recursion
          continue;
        }
        if (!a.RefTo) {
          console.warn(`invalid referenced id "${name}"`);
          continue;
        }
        let referencedAttrs = this.generateAttributesForTable(a.RefTo, a);
        attrs = attrs.concat(referencedAttrs);
        continue;
      } else {
        type = a.Type;
      }

      if (beingReferences && a.Type === AttrType.SERIAL) {
        type = 'INT';
      }

      let attrLine = [`${name} ${type}`];

      if (a.Option?.Default) {
        let def = a.Option.Default;
        if ([AttrType.VARCHAR, AttrType.CHAR].includes(a.Type)) {
          def = `'${def.replaceAll("'", "''")}'`;
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
    return attrs;
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
