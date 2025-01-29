import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCodeOutputComponent } from './dialog-code-output.component';

describe('DialogCodeOutputComponent', () => {
  let component: DialogCodeOutputComponent;
  let fixture: ComponentFixture<DialogCodeOutputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogCodeOutputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogCodeOutputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
