import { TestBed } from '@angular/core/testing';

import { LanguageHtmlService } from './language-html.service';

describe('LanguageHtmlService', () => {
  let service: LanguageHtmlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageHtmlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
