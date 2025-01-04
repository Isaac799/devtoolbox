import { Pipe, PipeTransform } from '@angular/core';
import { AttrType, defaultValueValidatorHintMap } from '../structure';

const none = 'No hint available for this type.';

@Pipe({
  name: 'defaultValueHint',
})
export class DefaultValueHintPipe implements PipeTransform {
  transform(attrType: AttrType | null): string {
    if (!attrType) {
      return none;
    }
    return defaultValueValidatorHintMap.get(attrType) || none;
  }
}
