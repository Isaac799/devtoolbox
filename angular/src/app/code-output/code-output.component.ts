import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { alignKeywords, alignKeyword, convertCase } from '../formatting';
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
          this.output = this.schemasToGoStructs(schemas);
          break;
        case AppGeneratorMode.TS:
          this.output = this.schemasToTsInterfaces(schemas);
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
      drops.push(`DROP SCHEMA IF EXISTS ${convertCase(s.Name, 'snake')};`);
      createTableLines.push(
        `CREATE SCHEMA IF NOT EXISTS ${convertCase(s.Name, 'snake')};`
      );
      for (const t of s.Tables) {
        drops.push(`DROP TABLE IF EXISTS ${convertCase(t.Name, 'snake')};`);
        createTableLines.push(
          `CREATE TABLE IF NOT EXISTS ${convertCase(t.Name, 'snake')} (`
        );
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

    let pks = t.Attributes.filter((e) => e.Option?.PrimaryKey).map((e) =>
      convertCase(e.Name, 'snake')
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
        let uniquesStr = `UNIQUE ( ${convertCase(e, 'snake')} )`;
        endThings.push(uniquesStr);
      }
    }

    let refs = t.Attributes.filter((e) => e.RefTo);
    if (refs.length > 0) {
      for (const e of refs) {
        let r = e.RefTo!;
        let rPks = r.Attributes.filter((e) => e.Option?.PrimaryKey);
        for (const rPk of rPks) {
          let rStr = `FOREIGN KEY ( ${convertCase(
            e.Name,
            'snake'
          )} ) REFERENCES ${TableFullName(r)} ( ${convertCase(
            rPk.Name,
            'snake'
          )} ) ON DELETE CASCADE`;
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
          let rStr = `CREATE INDEX  ${convertCase(
            `idx_${AttributeNameWithSchemaAndTable(rPk)}`,
            'snake'
          )} ON ${TableFullName(r)} ( ${convertCase(rPk.Name, 'snake')} );`;
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

      let attrLine = [
        `${convertCase(name, 'snake')} ${convertCase(type, 'upper')}`,
      ];

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

  schemasToTsInterfaces(schemas: Schema[]) {
    const SQL_TO_TS_TYPE: Record<AttrType, string> = {
      [AttrType.BIT]: 'boolean',
      [AttrType.DATE]: 'Date',
      [AttrType.CHAR]: 'string',
      [AttrType.TIME]: 'Date',
      [AttrType.TIMESTAMP]: 'Date',
      [AttrType.SERIAL]: 'number',
      [AttrType.DECIMAL]: 'number',
      [AttrType.FLOAT]: 'number',
      [AttrType.REAL]: 'number',
      [AttrType.INT]: 'number',
      [AttrType.BOOLEAN]: 'boolean',
      [AttrType.VARCHAR]: 'string',
      [AttrType.MONEY]: 'number',
      [AttrType.REFERENCE]: '',
    };

    let lines: string[] = [];
    for (const s of schemas) {
      for (const t of s.Tables) {
        lines.push(`type ${convertCase(t.Name, 'pascal')} = {`);
        for (const a of t.Attributes) {
          if (a.Type === AttrType.REFERENCE) {
            continue;
          }
          lines.push(
            `${TAB}${convertCase(a.Name, 'camel')}: ${SQL_TO_TS_TYPE[a.Type]}`
          );
        }

        let refs = t.Attributes.filter((e) => e.RefTo);
        if (refs.length > 0) {
          for (const e of refs) {
            let r = e.RefTo!;
            if (!r.Parent) {
              console.warn('missing parent on gen go ref');
              continue;
            }
            let rN = `${e.Name}_${r.Name}`;
            let rStr = `${TAB}${convertCase(rN, 'camel')}: ${convertCase(
              r.Name,
              'pascal'
            )} | null`;
            lines.push(rStr);
          }
        }
        lines.push(`}`);
      }
    }
    lines = alignKeywords(lines, Object.values(SQL_TO_TS_TYPE));
    lines = alignKeyword(lines, ':');
    lines = alignKeyword(lines, '| null');
    let str = lines.join('\n');
    return str;
  }

  schemasToGoStructs(schemas: Schema[]) {
    const SQL_TO_GO_TYPE: Record<AttrType, string> = {
      [AttrType.BIT]: 'bool',
      [AttrType.DATE]: 'time.Time',
      [AttrType.CHAR]: 'string',
      [AttrType.TIME]: 'time.Time',
      [AttrType.TIMESTAMP]: 'time.Time',
      [AttrType.SERIAL]: 'int',
      [AttrType.DECIMAL]: 'float64',
      [AttrType.FLOAT]: 'float64',
      [AttrType.REAL]: 'float64',
      [AttrType.INT]: 'int',
      [AttrType.BOOLEAN]: 'bool',
      [AttrType.VARCHAR]: 'string',
      [AttrType.MONEY]: 'float64',
      [AttrType.REFERENCE]: '',
    };

    let lines: string[] = [];
    for (const s of schemas) {
      for (const t of s.Tables) {
        lines.push(`type ${convertCase(t.Name, 'pascal')} struct {`);
        for (const a of t.Attributes) {
          if (a.Type === AttrType.REFERENCE) {
            continue;
          }

          lines.push(
            `${TAB}${convertCase(a.Name, 'pascal')} ${
              SQL_TO_GO_TYPE[a.Type]
            } \`json:"${convertCase(a.Name, 'camel')}"\``
          );
        }

        let refs = t.Attributes.filter((e) => e.RefTo);
        if (refs.length > 0) {
          for (const e of refs) {
            let r = e.RefTo!;
            if (!r.Parent) {
              console.warn('missing parent on gen go ref');
              continue;
            }
            let rN = `${e.Name}_${r.Name}`;
            let rStr = `${TAB}${convertCase(rN, 'pascal')} *${convertCase(
              r.Name,
              'pascal'
            )} \`json:"${convertCase(rN, 'camel')}"\``;
            lines.push(rStr);
          }
        }
        lines.push(`}`);
      }
    }
    lines = alignKeywords(lines, ['*', ...Object.values(SQL_TO_GO_TYPE)]);
    lines = alignKeyword(lines, '`json:');
    let str = lines.join('\n');
    return str;
  }
}
