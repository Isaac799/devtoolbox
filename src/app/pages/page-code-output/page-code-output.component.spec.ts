import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageCodeOutputComponent } from './page-code-output.component';

describe('PageCodeOutputComponent', () => {
  let component: PageCodeOutputComponent;
  let fixture: ComponentFixture<PageCodeOutputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageCodeOutputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageCodeOutputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
