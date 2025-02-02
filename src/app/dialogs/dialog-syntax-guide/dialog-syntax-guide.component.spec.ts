import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogSyntaxGuideComponent } from './dialog-syntax-guide.component';

describe('DialogSyntaxGuideComponent', () => {
  let component: DialogSyntaxGuideComponent;
  let fixture: ComponentFixture<DialogSyntaxGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogSyntaxGuideComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogSyntaxGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
