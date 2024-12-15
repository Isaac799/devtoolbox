import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { WebSocketService } from './services/web-socket.service';
import {
  App,
  AppComplexityMode,
  AppGeneratorMode,
  AppMode,
  Attribute,
  AttrType,
  Schema,
  Table,
} from './structure';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import YAML from 'yaml';
import { schemasToPostgreSQL } from './code';
import { MinMaxLabelFromAttrTypePipe } from './pipes/min-max-label-from-attr-type.pipe';
import { MinMaxRelevantPipe } from './pipes/min-max-relevant.pipe';
import { ModalComponent } from './modal/modal.component';
import { validationMap } from './constants';
import { DefaultValueHintPipe } from './pipes/default-value-hint.pipe';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MinMaxLabelFromAttrTypePipe,
    MinMaxRelevantPipe,
    ModalComponent,
    DefaultValueHintPipe,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  readonly title = 'devtoolbox';
  private readonly stateSessionKey = 'devtoolboxState';
  private readonly configSessionKey = 'devtoolboxAppConfig';
  private readonly regexSnakeCase = /(\w+)_(\w+)/;
  editor = '';
  generatorOutput = '';
  private _serial = 0;
  private get serial() {
    return this._serial;
  }
  private set serial(value) {
    this._serial = value;
    this.saveConfig();
  }
  showModalSchema: boolean = false;
  showSettingsModal: boolean = false;
  showModalTable: boolean = false;
  showModalAttribute: boolean = false;

  showAttrOptions: boolean = false;
  showAttrValidation: boolean = false;
  showSmartAttributes: boolean = false;

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
    generatorMode: AppGeneratorMode.Postgres,
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

  generatorModeOptions = [
    {
      name: 'PostgreSQL',
      value: AppGeneratorMode.Postgres,
    },
    {
      name: 'Go',
      value: AppGeneratorMode.Go,
    },
    {
      name: 'Typescript',
      value: AppGeneratorMode.TS,
    },
  ];

  private readonly presetAttributes: Attribute[] = [
    {
      id: -1,
      parent_id: -1,
      Name: 'id',
      Type: AttrType.SERIAL,
      Options: {
        PrimaryKey: true,
        Unique: true,
      },
    },
    {
      id: -1,
      parent_id: -1,
      Name: 'title',
      Type: AttrType.VARCHAR,
      Options: {
        PrimaryKey: false,
        Unique: true,
      },
      Validation: {
        Required: true,
        Min: 3,
        Max: 31,
      },
    },
    {
      id: -1,
      parent_id: -1,
      Name: 'inserted_at',
      Type: AttrType.TIMESTAMP,
      Options: {
        PrimaryKey: false,
        Default: 'CURRENT_TIMESTAMP',
      },
    },
    {
      id: -1,
      parent_id: -1,
      Name: 'updated_at',
      Type: AttrType.TIMESTAMP,
      Options: {
        PrimaryKey: false,
        Default: 'CURRENT_TIMESTAMP',
      },
    },
    {
      id: -1,
      parent_id: -1,
      Name: 'email',
      Type: AttrType.VARCHAR,
      Options: {
        Unique: true,
      },
      Validation: {
        Min: 5,
        Max: 63,
        Required: true,
      },
    },
    {
      id: -1,
      parent_id: -1,
      Name: 'revision',
      Type: AttrType.INT,
      Options: {
        Unique: true,
      },
      Validation: {
        Min: 1,
        Max: 999,
        Required: true,
      },
    },
  ];

  get smartSuggestions(): Attribute[] {
    const t = this.selectedTable;
    if (!t) return [];
    const attrNames = t.Attributes.map((e) => e.Name.toLowerCase());
    let answer = [];
    for (const e of this.presetAttributes) {
      if (attrNames.includes(e.Name.toLowerCase())) {
        continue;
      }
      answer.push(JSON.parse(JSON.stringify(e)));
    }
    return answer;
  }

  clickSmartSuggestion(a: Attribute) {
    this.setAttributeForm(a);
  }

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
    this.updateCodeGenerated();
    this.serial = AppComponent.discoverSerial(this.schemas);
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

    this.showSmartAttributes = false;
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
    this.setSchemaForm(s);
  }
  private setSchemaForm(s: Schema) {
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
    this.setTableForm(t);
  }
  private setTableForm(t: Table) {
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
      this.showSmartAttributes = true;
      return;
    }
    this.setAttributeForm(a);
  }

  private setAttributeForm(a: Attribute) {
    this.showAttrOptions = a.Options !== undefined;
    this.showAttrValidation = a.Validation !== undefined;

    let c = this.attributeForm.controls;
    c.Name.setValue(a.Name);
    c.Type.setValue(a.Type!);
    if (a.Options) {
      if (a.Options.PrimaryKey !== undefined) {
        c.PrimaryKey.setValue(a.Options.PrimaryKey);
      }
      if (a.Options.Unique !== undefined) {
        c.Unique.setValue(a.Options.Unique);
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
    this.updateCodeGenerated();
    this.updateEditor();
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
        if (c.Unique.value !== null) {
          sa.Options.Unique = c.Unique.value;
        } else {
          sa.Options.Unique = undefined;
        }
        if (c.Default.value !== null) {
          sa.Options.Default = c.Default.value;
        } else {
          sa.Options.Default = undefined;
        }
      } else {
        sa.Options = undefined;
      }

      if (this.showAttrValidation) {
        if (!sa.Validation) {
          sa.Validation = {};
        }

        let minMaxRelevant = new MinMaxRelevantPipe().transform(c.Type.value);
        if (c.Min.value !== null && minMaxRelevant) {
          sa.Validation.Min = c.Min.value;
        } else {
          sa.Validation.Min = undefined;
        }
        if (c.Max.value !== null && minMaxRelevant) {
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
    this.updateCodeGenerated();
    this.updateEditor();
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
    this.updateCodeGenerated();
    this.updateEditor();
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
    this.updateCodeGenerated();
    this.updateEditor();
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
    this.updateCodeGenerated();
    this.updateEditor();
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
    this.updateCodeGenerated();
    this.updateEditor();
    this.saveState();
    this.showModalSchema = false;
  }

  saveState() {
    this.updateEditor();
    this.updateCodeGenerated();

    let s = JSON.stringify(this.schemas, null, 2);
    sessionStorage.setItem(this.stateSessionKey, s);
  }

  saveConfig() {
    let s = JSON.stringify(this.app, null, 2);
    sessionStorage.setItem(this.configSessionKey, s);
  }

  updateCodeGenerated() {
    switch (this.app.generatorMode) {
      case AppGeneratorMode.Postgres:
        this.generatorOutput = schemasToPostgreSQL(this.schemas);
        break;
      case AppGeneratorMode.Go:
        break;
      case AppGeneratorMode.TS:
        break;
    }
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

  private validDefault = () => {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!this.attributeForm) {
        console.warn('missing attr form');
        return null;
      }

      let c = this.attributeForm.controls;

      if (!control.value) {
        return null;
      }

      let t = c.Type.value;

      if (t === null) {
        return {
          invalid: 'missing type of attribute',
        };
      }

      const validatorFn = validationMap.get(t);

      if (!validatorFn) {
        console.error(`missing valid default fn for type ${t}`);
        return {
          'internal error':
            'not able to handle default value validation for attribute type',
        };
      }

      let a = validatorFn(control.value || '');
      console.log('a :>> ', a);
      let answer = a
        ? null
        : {
            'invalid default value': 'please make another entry',
          };
      return answer;
    };
  };

  nameValidation = [
    Validators.required,
    Validators.minLength(2),
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
    Default: new FormControl('', [this.validDefault()]),
    Required: new FormControl(true, []),
    Min: new FormControl(0, []),
    Max: new FormControl(1, []),
  });
}
