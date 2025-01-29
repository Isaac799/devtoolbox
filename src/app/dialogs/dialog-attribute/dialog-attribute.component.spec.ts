import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAttributeComponent } from './dialog-attribute.component';

describe('DialogAttributeComponent', () => {
  let component: DialogAttributeComponent;
  let fixture: ComponentFixture<DialogAttributeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogAttributeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogAttributeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
