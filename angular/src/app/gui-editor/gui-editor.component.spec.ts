import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuiEditorComponent } from './gui-editor.component';

describe('GuiEditorComponent', () => {
  let component: GuiEditorComponent;
  let fixture: ComponentFixture<GuiEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuiEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuiEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
