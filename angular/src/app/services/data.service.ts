import { Injectable } from '@angular/core';
import {
  Schema,
  App,
  AppComplexityMode,
  AppGeneratorMode,
  AppMode,
  Table,
  Attribute,
  SchemaConfig,
  TableConfig,
  AttributeConfig,
} from '../structure';
import YAML from 'yaml';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly stateSessionKey = 'devtoolboxState';
  private readonly configSessionKey = 'devtoolboxAppConfig';
  private initialized: boolean = false;

  schemas: Schema[] = [];
  schemasConfig: Record<string, SchemaConfig> = {};
  editor = '';
  regenerateOutput = new Subject<Schema[]>();

  app: App = {
    mode: AppMode.YAML,
    generatorMode: AppGeneratorMode.Postgres,
    complexity: AppComplexityMode.Advanced,
  };

  constructor() {}

  ReloadAndSave() {
    this.Reload();
    this.Save();
  }

  Reload() {
    this.updateEditor();
    this.regenerateOutput.next(this.schemas);
  }

  Save() {
    this.saveConfig();
    this.saveState();
  }

  Initialize() {
    if (this.initialized) {
      return;
    }
    this.initialized;
    this.loadConfig();
    this.loadLastSession();
    setTimeout(() => {
      this.Reload();
    }, 0);
  }

  private loadConfig() {
    let save = localStorage.getItem(this.configSessionKey);
    if (!save) {
      return;
    }
    try {
      this.app = JSON.parse(save);
    } catch (err) {
      console.error(err);
      localStorage.removeItem(this.configSessionKey);
    }
  }

  private loadLastSession() {
    let save = localStorage.getItem(this.stateSessionKey);
    if (!save) {
      return;
    }
    let schemasConfig: Record<string, SchemaConfig> = {};
    try {
      schemasConfig = JSON.parse(save);
    } catch (err) {
      console.error(err);
      localStorage.removeItem(this.stateSessionKey);
    }

    let schemas: Schema[] = [];
    let allTables: Table[] = [];
    for (const sk in schemasConfig) {
      if (!Object.prototype.hasOwnProperty.call(schemasConfig, sk)) {
        continue;
      }
      const s = schemasConfig[sk];
      let s2: Schema = {
        ID: s.ID,
        Name: sk,
        Tables: [],
      };
      for (const tk in s.Tables) {
        if (!Object.prototype.hasOwnProperty.call(s.Tables, tk)) {
          continue;
        }
        const t = s.Tables[tk];
        let t2p = [s2, ...schemas].find((e) => e.ID === t.ParentID);
        let t2: Table = {
          ID: t.ID,
          Parent: t2p,
          Name: tk,
          Attributes: [],
        };
        for (const ak in t.Attributes) {
          if (!Object.prototype.hasOwnProperty.call(t.Attributes, ak)) {
            continue;
          }
          const a = t.Attributes[ak];
          let a2p = [t2, ...s2.Tables, ...allTables].find(
            (e) => e.ID === a.ParentID
          );
          let r2 = [t2, ...s2.Tables, ...allTables].find(
            (e) => e.ID === a.RefToID
          );
          let a2: Attribute = {
            ID: a.ID,
            Parent: a2p,
            RefTo: r2,
            Name: ak,
            Type: a.Type,
            Option: a.Option,
            Validation: a.Validation,
          };
          t2.Attributes.push(a2);
        }
        allTables.push(t2);
        s2.Tables.push(t2);
      }
      schemas.push(s2);
    }
    allTables = [];
    this.schemas = schemas;
  }

  private saveState() {
    let schemasConfig: Record<string, SchemaConfig> = {};
    for (const s of this.schemas) {
      let s2: SchemaConfig = {
        ID: s.ID,
        Tables: {},
      };
      for (const t of s.Tables) {
        let t2: TableConfig = {
          ID: t.ID,
          ParentID: t.Parent?.ID || 0,
          Attributes: {},
        };
        for (const a of t.Attributes) {
          let a2: AttributeConfig = {
            ID: a.ID,
            ParentID: a.Parent?.ID || 0,
            RefToID: a.RefTo?.ID,
            Type: a.Type,
            Option: a.Option,
            Validation: a.Validation,
          };
          t2.Attributes[a.Name] = a2;
        }
        s2.Tables[t.Name] = t2;
      }
      schemasConfig[s.Name] = s2;
    }
    this.schemasConfig = schemasConfig;
    let s = JSON.stringify(schemasConfig, null, 2);
    localStorage.setItem(this.stateSessionKey, s);
  }

  private saveConfig() {
    let s = JSON.stringify(this.app, null, 2);
    localStorage.setItem(this.configSessionKey, s);
  }

  private updateEditor() {
    switch (this.app.mode) {
      case AppMode.JSON:
        this.editor = JSON.stringify(this.schemasConfig, null, 2);
        break;
      case AppMode.YAML:
        this.editor = YAML.stringify(this.schemasConfig);
        break;
    }
  }

  getReference(id: number): Table | null {
    for (const s of this.schemas) {
      for (const t of s.Tables) {
        if (t.ID !== id) {
          continue;
        }
        return t;
      }
    }
    return null;
  }

  getPrimaryKeys(table: Table): Attribute[] {
    return table.Attributes.filter((e) => e.Option?.PrimaryKey);
  }
}
