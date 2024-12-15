import { Injectable } from '@angular/core';
import {
  Schema,
  AttrType,
  Table,
  Attribute,
  App,
  AppComplexityMode,
  AppGeneratorMode,
  AppMode,
} from '../structure';
import YAML from 'yaml';
import { CodeOutputComponent } from '../code-output/code-output.component';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly stateSessionKey = 'devtoolboxState';
  private readonly configSessionKey = 'devtoolboxAppConfig';
  private initialized: boolean = false;

  schemas: Schema[] = [];
  editor = '';
  regenerateOutput = new Subject<Schema[]>();

  app: App = {
    mode: AppMode.YAML,
    generatorMode: AppGeneratorMode.Postgres,
    complexity: AppComplexityMode.Simple,
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
  }

  private loadConfig() {
    let save = sessionStorage.getItem(this.configSessionKey);
    if (!save) {
      return;
    }
    try {
      this.app = JSON.parse(save);
    } catch (err) {
      console.error(err);
      sessionStorage.removeItem(this.configSessionKey);
    }
  }

  private loadLastSession() {
    let save = sessionStorage.getItem(this.stateSessionKey);
    if (!save) {
      return;
    }
    try {
      this.schemas = JSON.parse(save);
    } catch (err) {
      console.error(err);
      sessionStorage.removeItem(this.stateSessionKey);
    }
  }
  private saveState() {
    let s = JSON.stringify(this.schemas, null, 2);
    sessionStorage.setItem(this.stateSessionKey, s);
  }

  private saveConfig() {
    let s = JSON.stringify(this.app, null, 2);
    sessionStorage.setItem(this.configSessionKey, s);
  }

  private updateEditor() {
    switch (this.app.mode) {
      case AppMode.JSON:
        this.editor = JSON.stringify(this.schemas, null, 2);
        break;
      case AppMode.YAML:
        this.editor = YAML.stringify(this.schemas);
        break;
    }
  }
}
