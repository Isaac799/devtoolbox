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
  AttrType,
  AppInputMode,
} from '../structure';
import { Subject } from 'rxjs';
import { defaultConfig } from '../constants';
import YAML from 'yaml';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly stateSessionKey = 'devtoolboxState';
  private readonly configSessionKey = 'devtoolboxAppConfig';
  private initialized: boolean = false;

  editor = '';
  schemas: Schema[] = [];
  schemasConfig: Record<string, SchemaConfig> = {};
  schemasChange = new Subject<Schema[]>();
  schemasConfigChange = new Subject<Record<string, SchemaConfig>>();

  app: App = {
    inputMode: AppInputMode.GUI,
    mode: AppMode.YAML,
    generatorMode: AppGeneratorMode.Postgres,
    complexity: AppComplexityMode.Advanced,
  };

  constructor() {}

  ReloadAndSave() {
    this.saveConfig();

    if (this.app.inputMode === AppInputMode.GUI) {
      this.SaveFromGUI();
      this.EmitChangesForApp();
      return;
    }

    if (this.app.inputMode === AppInputMode.TUI) {
      this.saveFromTUI();
      if (this.app.mode === AppMode.JSON) {
        this.loadLastSession(this.editor);
      }

      if (this.app.mode === AppMode.YAML) {
        try {
          let json = YAML.parse(this.editor);
          this.loadLastSession(JSON.stringify(json));
        } catch (err) {
          // console.error(err);
        }
      }
      this.EmitChangesForApp();
      return;
    }
  }

  EmitChangesForApp() {
    this.schemasChange.next(this.schemas);
    this.schemasConfigChange.next(this.schemasConfig);
  }

  SaveFromGUI() {
    this.saveState();
  }

  private saveFromTUI() {
    if (this.app.mode === AppMode.JSON) {
      localStorage.setItem(this.stateSessionKey, this.editor);
      return;
    }

    if (this.app.mode === AppMode.YAML) {
      try {
        let json = YAML.parse(this.editor);
        localStorage.setItem(this.stateSessionKey, json);
      } catch (err) {
        console.error(err);
      }

      return;
    }
  }

  Initialize() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.loadConfig();
    this.loadLastSession();
    setTimeout(() => {
      this.EmitChangesForApp();
    }, 0);
  }

  private loadConfig() {
    let save = localStorage.getItem(this.configSessionKey);
    if (!save) {
      return;
    }
    try {
      let parsed = JSON.parse(save);
      if (!parsed) {
        throw new Error('failed parsing app config');
      }
      this.app = parsed;
    } catch (err) {
      console.error(err);
      localStorage.removeItem(this.configSessionKey);
    }
  }

  private loadLastSession(hot?: string) {
    let validHot =
      hot !== undefined &&
      ![null, 'null', '', undefined, 'undefined'].includes(hot || '');
    let stateStr = validHot ? hot : localStorage.getItem(this.stateSessionKey);
    let schemasConfig: Record<string, SchemaConfig> = {};

    try {
      if (!stateStr) {
        console.log('save was falsy, reset to default');
        schemasConfig = defaultConfig;
        localStorage.removeItem(this.stateSessionKey);
        localStorage.setItem(
          this.stateSessionKey,
          JSON.stringify(defaultConfig)
        );
      } else {
        schemasConfig = JSON.parse(stateStr);
      }
    } catch (err) {
      if (hot) {
        console.warn('failed parsing tui');
        return;
      } else {
        console.error(err);
        localStorage.removeItem(this.stateSessionKey);
      }
    }

    let schemas: Schema[] = ParseSchemaConfig(schemasConfig);

    this.schemasConfig = schemasConfig;
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
          ParentID: t.Parent.ID,
          Attributes: {},
        };
        for (const a of t.Attributes) {
          let a2: AttributeConfig = {
            ID: a.ID,
            ParentID: a.Parent.ID,
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
    if (s) {
      localStorage.setItem(this.stateSessionKey, s);
    }
  }

  private saveConfig() {
    let s = JSON.stringify(this.app, null, 2);
    if (s) {
      localStorage.setItem(this.stateSessionKey, s);
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

function ParseSchemaConfig(schemasConfig: Record<string, SchemaConfig>) {
  let schemas: Schema[] = [];
  let allTables: Table[] = [];

  let recheckAttrs: AttributeConfig[] = [];

  for (const sk in schemasConfig) {
    if (!Object.prototype.hasOwnProperty.call(schemasConfig, sk)) {
      continue;
    }
    const s = schemasConfig[sk];
    let s2 = new Schema(s.ID, sk);
    for (const tk in s.Tables) {
      if (!Object.prototype.hasOwnProperty.call(s.Tables, tk)) {
        continue;
      }
      const t = s.Tables[tk];
      let t2p = [s2, ...schemas].find((e) => e.ID === t.ParentID);
      if (!t2p) continue;

      let t2 = new Table(t.ID, tk, t2p);
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
        if (r2) {
          if (!r2.RefBy) {
            r2.RefBy = [];
          }
          // console.log(r2.Name, ' is ref by ', t2.Name);
          r2.RefBy.push(t2);
        }
        if (!a2p) {
          continue;
        }
        let a2 = new Attribute(a.ID, ak, a.Type, a2p);

        if (!r2 && a2.Type === AttrType.REFERENCE) {
          recheckAttrs.push(a);
        }

        if (r2) {
          a2.RefTo = r2;
        }
        if (a.Option) {
          a2.Option = a.Option;
        }
        if (a.Validation) {
          a2.Validation = a.Validation;
        }
        t2.Attributes.push(a2);
      }
      allTables.push(t2);
      s2.Tables.push(t2);
    }
    schemas.push(s2);
  }

  CheckForBadReferences(recheckAttrs, allTables, schemas);

  allTables = [];
  return schemas;
}

function CheckForBadReferences(
  recheckAttrs: AttributeConfig[],
  allTables: Table[],
  schemas: Schema[]
) {
  for (const a of recheckAttrs) {
    let r = allTables.find((e) => e.ID === a.RefToID);

    let realAttr: Attribute | null = null;

    search: for (const s of schemas) {
      for (const t of s.Tables) {
        for (const atr of t.Attributes) {
          if (atr.ID !== a.ID) {
            continue;
          }
          realAttr = atr;
          break search;
        }
      }
    }

    if (!realAttr) {
      continue;
    }

    if (realAttr.Type === AttrType.REFERENCE && !r) {
      realAttr.warnings.push(`failed to find reference`);
    } else if (!r) {
      realAttr.warnings.push(`reference to does not exist`);
    } else {
      realAttr.warnings.push(`reference to is made too soon`);
      realAttr.RefTo = r;
    }
  }
}
