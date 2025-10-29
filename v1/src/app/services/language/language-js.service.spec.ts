import { TestBed } from '@angular/core/testing';

import { LanguageJsService } from './language-js.service';

describe('LanguageJsService', () => {
  let service: LanguageJsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageJsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
