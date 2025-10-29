import { TestBed } from '@angular/core/testing';

import { LanguageTsqlService } from './language-tsql.service';

describe('LanguageTsqlService', () => {
  let service: LanguageTsqlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageTsqlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
