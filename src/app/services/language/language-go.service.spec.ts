import { TestBed } from '@angular/core/testing';

import { LanguageGoService } from './language-go.service';

describe('LanguageGoService', () => {
  let service: LanguageGoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageGoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
