import { TestBed } from '@angular/core/testing';

import { LanguagePsqlService } from './language-psql.service';

describe('LanguagePsqlService', () => {
  let service: LanguagePsqlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguagePsqlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
