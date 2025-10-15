import { TestBed } from '@angular/core/testing';

import { LanguageSqliteService } from './language-sqlite.service';

describe('LanguageSqliteService', () => {
  let service: LanguageSqliteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageSqliteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
