import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogSettingsComponent } from './dialog-settings.component';

describe('DialogSettingsComponent', () => {
  let component: DialogSettingsComponent;
  let fixture: ComponentFixture<DialogSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
