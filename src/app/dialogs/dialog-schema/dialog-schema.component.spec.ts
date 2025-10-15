import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogSchemaComponent } from './dialog-schema.component';

describe('DialogSchemaComponent', () => {
  let component: DialogSchemaComponent;
  let fixture: ComponentFixture<DialogSchemaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogSchemaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogSchemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
