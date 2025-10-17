import { TestBed } from '@angular/core/testing';

import { LanguageSqlService } from './language-sql.service';

describe('LanguageSqlService', () => {
  let service: LanguageSqlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageSqlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
