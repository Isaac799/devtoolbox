import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageGuiEditorComponent } from './page-gui-editor.component';

describe('PageGuiEditorComponent', () => {
  let component: PageGuiEditorComponent;
  let fixture: ComponentFixture<PageGuiEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageGuiEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageGuiEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
