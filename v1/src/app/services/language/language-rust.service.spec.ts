import { TestBed } from '@angular/core/testing';

import { LanguageRustService } from './language-rust.service';

describe('LanguageRustService', () => {
  let service: LanguageRustService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageRustService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
