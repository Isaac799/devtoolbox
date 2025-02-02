import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageSplitViewComponent } from './page-split-view.component';

describe('PageSplitViewComponent', () => {
  let component: PageSplitViewComponent;
  let fixture: ComponentFixture<PageSplitViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageSplitViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageSplitViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
