import { TAB } from '../../constants';
import { Schema, Func, AppGeneratorMode, FuncIn } from '../../structure';

export function SchemasToAngularFormControls(schemas: Schema[]): string {
  let funcs: Func[] = [];
  for (const s of schemas) {
    for (const t of s.Tables) {
      let func = new Func(t, AppGeneratorMode.TSTypesAndFns);
      funcs.push(func);
    }
  }

  let lines: string[] = [];

  for (const f of funcs) {
    lines.push(`${f.title} = new FormGroup({`);
    let controls: string[] = [];
    for (const e of f.outputs) {
      const t = e.relatedInput ? e.relatedInput.type : e.type;
      const v = e.defaultValue || null;
      const validators = `[${GenerateValidatorsForAttribute(e.relatedInput)}]`;
      let formControl = `${TAB}${e.label}: new FormControl<${t}>(${v} , ${validators})`;
      controls.push(formControl);
    }
    lines = lines.concat(controls.join(`,\n`));
    lines.push(`})\n`);
  }

  let str = lines.join('\n');
  return str;
}

function GenerateValidatorsForAttribute(input: FuncIn | null) {
  if (!input) {
    return '';
  }

  let v = input.validation;

  if (!v) {
    return '';
  }

  let validators: string[] = [];

  if (v.Required) {
    validators.push('Validators.required');
  }
  if (v.Min != undefined) {
    if (input.isNumerical) {
      validators.push(`Validators.min(${v.Min})`);
    } else {
      validators.push(`Validators.minLength(${v.Min})`);
    }
  }
  if (v.Max != undefined) {
    if (input.isNumerical) {
      validators.push(`Validators.max(${v.Max})`);
    } else {
      validators.push(`Validators.maxLength(${v.Max})`);
    }
  }

  let validatorsStr = validators.join(', ');
  return validatorsStr;
}
