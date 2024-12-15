import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { WebSocketService } from './services/web-socket.service';
import {
  App,
  AppComplexityMode,
  AppMode,
  Attribute,
  AttrType,
  Schema,
  Table,
} from './structure';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import YAML from 'yaml';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  readonly title = 'devtoolbox';
  private readonly stateSessionKey = 'devtoolboxState';
  private readonly configSessionKey = 'devtoolboxAppConfig';
  private readonly regexSnakeCase = /(\w+)_(\w+)/;
  editor = '';
  private _serial = 0;
  private get serial() {
    return this._serial;
  }
  private set serial(value) {
    this._serial = value;
    this.saveConfig();
  }
  private _showModalSchema: boolean = false;
  private _showSettingsModal: boolean = false;
  public get showSettingsModal(): boolean {
    return this._showSettingsModal;
  }
  public set showSettingsModal(value: boolean) {
    this._showSettingsModal = value;
    this.saveConfig();
  }
  showAttrOptions: boolean = false;
  showAttrValidation: boolean = false;
  public get showModalSchema(): boolean {
    return this._showModalSchema;
  }
  public set showModalSchema(value: boolean) {
    if (!value) {
      this.clearSelections();
    }
    this._showModalSchema = value;
  }
  @ViewChild('modaLSchema') modaLSchema!: HTMLDivElement;
  private _showModalTable: boolean = false;
  public get showModalTable(): boolean {
    return this._showModalTable;
  }
  public set showModalTable(value: boolean) {
    if (!value) {
      this.clearSelections();
    }
    this._showModalTable = value;
  }
  @ViewChild('modaLTable') modaLTable!: HTMLDivElement;
  private _showModalAttribute: boolean = false;
  public get showModalAttribute(): boolean {
    return this._showModalAttribute;
  }
  public set showModalAttribute(value: boolean) {
    if (!value) {
      this.clearSelections();
    }
    this._showModalAttribute = value;
  }
  @ViewChild('modaLAttribute') modaLAttribute!: HTMLDivElement;

  private _selectedAttribute: Attribute | null = null;
  public get selectedAttribute(): Attribute | null {
    return this._selectedAttribute;
  }
  public set selectedAttribute(value: Attribute | null) {
    if (value?.id !== this.selectedAttribute?.id) {
      this.attributeForm.reset();
    }
    this._selectedAttribute = value;
  }
  private _selectedTable: Table | null = null;
  public get selectedTable(): Table | null {
    return this._selectedTable;
  }
  public set selectedTable(value: Table | null) {
    if (value?.id !== this.selectedTable?.id) {
      this.tableForm.reset();
    }
    this._selectedTable = value;
  }
  private _selectedSchema: Schema | null = null;
  public get selectedSchema(): Schema | null {
    return this._selectedSchema;
  }
  public set selectedSchema(value: Schema | null) {
    if (value?.id !== this.selectedSchema?.id) {
      this.schemaForm.reset();
    }
    this._selectedSchema = value;
  }

  @ViewChild('schemaName') schemaNameRef: ElementRef | null = null;
  @ViewChild('tableName') tableNameRef: ElementRef | null = null;
  @ViewChild('attrName') attrNameRef: ElementRef | null = null;

  app: App = {
    mode: AppMode.YAML,
    complexity: AppComplexityMode.Simple,
  };

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

  private readonly attrTypeOptionsSimple = [
    { name: 'Auto Increment', value: AttrType.SERIAL },
    { name: 'Word', value: AttrType.VARCHAR },
    { name: 'Whole Number', value: AttrType.INT },
    { name: 'Fractional Number', value: AttrType.REAL },
    { name: 'Single Character', value: AttrType.CHAR },
    { name: 'Date and Time', value: AttrType.TIMESTAMP },
    { name: 'Money', value: AttrType.MONEY },
    { name: 'True or False', value: AttrType.BOOLEAN },
  ];

  private readonly attrTypeOptionsAdvanced = [
    { name: 'Auto Increment', value: AttrType.SERIAL },
    { name: 'Bit', value: AttrType.BIT },
    { name: 'Date', value: AttrType.DATE },
    { name: 'Character', value: AttrType.CHAR },
    { name: 'Time', value: AttrType.TIME },
    { name: 'Timestamp', value: AttrType.TIMESTAMP },
    { name: 'Decimal', value: AttrType.DECIMAL },
    { name: 'Real', value: AttrType.REAL },
    { name: 'Float', value: AttrType.FLOAT },
    { name: 'Money', value: AttrType.MONEY },
    { name: 'Integer', value: AttrType.INT },
    { name: 'Boolean', value: AttrType.BOOLEAN },
    { name: 'Varchar', value: AttrType.VARCHAR },
  ];

  public get attrTypeOptions() {
    return this.app.complexity === AppComplexityMode.Simple
      ? this.attrTypeOptionsSimple
      : this.attrTypeOptionsAdvanced;
  }

  schemas: Schema[] = [];

  constructor(ws: WebSocketService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadLastSession();
    this.loadConfig();
    this.updateEditor();
    this.serial = AppComponent.discoverSerial(this.schemas);
    this.addKeyboardListeners();
  }

  private get modalOpen() {
    return (
      this.showModalTable ||
      this.showModalAttribute ||
      this.showModalSchema ||
      this.showSettingsModal
    );
  }

  closeAllModals() {
    this.showSettingsModal = false;
    this.showModalTable = false;
    this.showModalAttribute = false;
    this.showModalSchema = false;
  }

  addKeyboardListeners() {
    window.addEventListener('keyup', (ev) => {
      if (!this.modalOpen) {
        return;
      }
      if (!['Escape'].includes(ev.key)) {
        return;
      }
      this.closeAllModals();
    });
  }

  doShowModalSchema(s?: Schema) {
    this.closeAllModals();
    this.showModalSchema = true;
    this.cdr.detectChanges();
    if (this.schemaNameRef) {
      this.schemaNameRef.nativeElement.focus();
    }
    this.selectedSchema = s || null;
    if (!s) {
      return;
    }
    this.schemaForm.controls.Name.setValue(s.Name);
  }
  doShowModalTable(s: Schema, t?: Table) {
    this.closeAllModals();
    this.showModalTable = true;
    this.cdr.detectChanges();
    if (this.tableNameRef) {
      console.log('its focusing');
      this.tableNameRef.nativeElement.focus();
    } else {
      console.log('nothing to focus on');
    }
    this.selectedSchema = s;
    this.selectedTable = t || null;
    if (!t) {
      return;
    }
    this.tableForm.controls.Name.setValue(t.Name);
  }
  doShowModalAttribute(s: Schema, t: Table, a?: Attribute) {
    this.closeAllModals();
    this.showModalAttribute = true;
    this.cdr.detectChanges();
    if (this.attrNameRef) {
      this.attrNameRef.nativeElement.focus();
    }
    this.selectedSchema = s;
    this.selectedTable = t;
    this.selectedAttribute = a || null;
    if (!a) {
      this.showAttrOptions = false;
      this.showAttrValidation = false;
      return;
    }
    this.showAttrOptions = a.Options !== undefined;
    this.showAttrValidation = a.Validation !== undefined;

    let c = this.attributeForm.controls;
    c.Name.setValue(a.Name);
    c.Type.setValue(a.Type!);
    if (a.Options) {
      if (a.Options.PrimaryKey !== undefined) {
        c.PrimaryKey.setValue(a.Options.PrimaryKey);
      }
      if (a.Options.Readonly !== undefined) {
        c.Readonly.setValue(a.Options.Readonly);
      }
      if (a.Options.Default !== undefined) {
        c.Default.setValue(a.Options.Default);
      }
    }
    if (a.Validation) {
      if (a.Validation.Required !== undefined) {
        c.Required.setValue(a.Validation.Required);
      }
      if (a.Validation.Min !== undefined) {
        c.Min.setValue(a.Validation.Min);
      }
      if (a.Validation.Max !== undefined) {
        c.Max.setValue(a.Validation.Max);
      }
    }
  }

  clearSelections() {
    this.selectedSchema = null;
    this.selectedTable = null;
    this.selectedAttribute = null;
  }

  static discoverSerial(schemas: Schema[]): number {
    let largest = 1;
    for (const s of schemas) {
      if (s.id > largest) {
        largest = s.id;
      }
      for (const t of s.Tables) {
        if (t.id > largest) {
          largest = t.id;
        }
        for (const a of t.Attributes) {
          if (a.id > largest) {
            largest = a.id;
          }
        }
      }
    }
    return largest + 1;
  }

  loadConfig() {
    let save = sessionStorage.getItem(this.configSessionKey);
    if (!save) {
      return;
    }
    try {
      console.log('restored config: serial: ', this.serial);
      this.app = JSON.parse(save);
    } catch (err) {
      console.error(err);
      sessionStorage.removeItem(this.configSessionKey);
    }
  }

  loadLastSession() {
    let save = sessionStorage.getItem(this.stateSessionKey);
    if (!save) {
      return;
    }
    try {
      console.log('restored session');
      this.schemas = JSON.parse(save);
      this.updateEditor();
    } catch (err) {
      console.error(err);
      sessionStorage.removeItem(this.stateSessionKey);
    }
  }

  clickDelAttribute() {
    let t = this.selectedTable;
    if (!t) {
      return;
    }
    let a = this.selectedAttribute;
    if (!a) {
      return;
    }
    let i = t.Attributes.findIndex((e) => e.id === a.id);
    if (i === -1) {
      return;
    }
    t.Attributes.splice(i, 1);
    this.showModalAttribute = false;
    this.saveState();
  }
  clickSaveAttribute() {
    if (!this.selectedTable) return;
    if (!this.attributeForm.valid) return;
    let sa = this.selectedAttribute;
    let c = this.attributeForm.controls;
    if (sa) {
      sa.Name = c.Name.value!.trim();
      sa.Type = c.Type.value!;

      if (this.showAttrOptions) {
        if (!sa.Options) {
          sa.Options = {};
        }
        if (c.PrimaryKey.value !== null) {
          sa.Options.PrimaryKey = c.PrimaryKey.value;
        } else {
          sa.Options.PrimaryKey = undefined;
        }
        if (c.Readonly.value !== null) {
          sa.Options.Readonly = c.Readonly.value;
        } else {
          sa.Options.Readonly = undefined;
        }
        if (c.Unique.value !== null) {
          sa.Options.Unique = c.Unique.value;
        } else {
          sa.Options.Unique = undefined;
        }
      } else {
        sa.Options = undefined;
      }
      if (this.showAttrValidation) {
        if (!sa.Validation) {
          sa.Validation = {};
        }
        if (c.Min.value !== null) {
          sa.Validation.Min = c.Min.value;
        } else {
          sa.Validation.Min = undefined;
        }
        if (c.Max.value !== null) {
          sa.Validation.Max = c.Max.value;
        } else {
          sa.Validation.Max = undefined;
        }
        if (c.Required.value !== null) {
          sa.Validation.Required = c.Required.value;
        } else {
          sa.Validation.Required = undefined;
        }
      } else {
        sa.Validation = undefined;
      }
    } else {
      let newAttr: Attribute = {
        id: this.serial,
        parent_id: this.selectedTable.id,
        Name: c.Name.value!,
        Type: c.Type.value!,
      };
      if (this.showAttrOptions) {
        newAttr['Options'] = {
          Default: c.Default.value!,
          Unique: c.Unique.value!,
          PrimaryKey: c.PrimaryKey.value!,
          Readonly: c.Readonly.value!,
        };
      }
      if (this.showAttrValidation) {
        newAttr['Validation'] = {
          Min: c.Min.value!,
          Max: c.Max.value!,
          Required: c.Required.value!,
        };
      }
      this.selectedTable.Attributes.push(newAttr);
      this.serial += 1;
    }
    this.attributeForm.reset();
    this.saveState();
    this.showModalAttribute = false;
  }

  clickDelTable() {
    let s = this.selectedSchema;
    if (!s) {
      return;
    }
    let t = this.selectedTable;
    if (!t) {
      return;
    }
    let i = s.Tables.findIndex((e) => e.id === t.id);
    if (i === -1) {
      return;
    }
    s.Tables.splice(i, 1);
    this.showModalTable = false;
    this.saveState();
  }
  clickSaveTable() {
    if (!this.selectedSchema) return;
    if (!this.tableForm.valid) return;
    let st = this.selectedTable;
    let c = this.tableForm.controls;
    if (st) {
      st.Name = c.Name.value!.trim();
    } else {
      this.selectedSchema.Tables.push({
        id: this.serial,
        parent_id: this.selectedSchema.id,
        Name: c.Name.value!,
        // Options: {
        //   AutoPrimaryKey: false,
        //   AutoTimestamps: false,
        // },
        Attributes: [],
      });
      this.serial += 1;
    }
    this.schemaForm.reset();
    this.saveState();
    this.showModalTable = false;
  }

  clickDelSchema() {
    let s = this.selectedSchema;
    if (!s) {
      return;
    }
    let i = this.schemas.findIndex((e) => e.id === s.id);
    if (i === -1) {
      return;
    }
    this.schemas.splice(i, 1);
    this.showModalSchema = false;
    this.saveState();
  }
  clickSaveSchema() {
    if (!this.schemaForm.valid) return;
    let ss = this.selectedSchema;
    let c = this.schemaForm.controls;
    if (ss) {
      ss.Name = c.Name.value!.trim();
    } else {
      this.schemas.push({
        id: this.serial,
        Name: c.Name.value!,
        Tables: [],
      });
      this.serial += 1;
    }
    this.schemaForm.reset();
    this.saveState();
    this.showModalSchema = false;
  }

  saveState() {
    this.updateEditor();
    let s = JSON.stringify(this.schemas, null, 2);
    sessionStorage.setItem(this.stateSessionKey, s);
  }

  saveConfig() {
    let s = JSON.stringify(this.app, null, 2);
    sessionStorage.setItem(this.configSessionKey, s);
  }

  updateEditor() {
    switch (this.app.mode) {
      case AppMode.JSON:
        this.editor = JSON.stringify(this.schemas, null, 2);
        break;
      case AppMode.YAML:
        this.editor = YAML.stringify(this.schemas);
        break;
    }
  }

  nameValidation = [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(128),
    // Validators.pattern(this.regexSnakeCase),
  ];

  schemaForm = new FormGroup({
    Name: new FormControl('', this.nameValidation),
  });

  tableForm = new FormGroup({
    Name: new FormControl('', this.nameValidation),
  });

  attributeForm = new FormGroup({
    Name: new FormControl('', this.nameValidation),
    Type: new FormControl<AttrType | null>(AttrType.VARCHAR, [
      Validators.required,
    ]),
    PrimaryKey: new FormControl(false, []),
    Readonly: new FormControl(false, []),
    // Unique: new FormControl<string[]>([], [Validators.required]),
    Unique: new FormControl(false, []),
    Default: new FormControl('', []),
    Required: new FormControl(true, []),
    Min: new FormControl(0, []),
    Max: new FormControl(1, []),
  });
}
