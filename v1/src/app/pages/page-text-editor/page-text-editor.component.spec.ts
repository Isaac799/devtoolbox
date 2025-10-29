import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageTextEditorComponent } from './page-text-editor.component';

describe('PageTextEditorComponent', () => {
  let component: PageTextEditorComponent;
  let fixture: ComponentFixture<PageTextEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageTextEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageTextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
