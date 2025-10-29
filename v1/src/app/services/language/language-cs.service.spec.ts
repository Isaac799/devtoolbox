import { TestBed } from '@angular/core/testing';

import { LanguageCsService } from './language-cs.service';

describe('LanguageCsService', () => {
  let service: LanguageCsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageCsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
