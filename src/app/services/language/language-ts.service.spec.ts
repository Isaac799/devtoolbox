import { TestBed } from '@angular/core/testing';

import { LanguageTsService } from './language-ts.service';

describe('LanguageTsService', () => {
  let service: LanguageTsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageTsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
