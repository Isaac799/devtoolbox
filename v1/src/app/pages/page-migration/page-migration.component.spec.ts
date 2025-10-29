import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageMigrationComponent } from './page-migration.component';

describe('PageMigrationComponent', () => {
  let component: PageMigrationComponent;
  let fixture: ComponentFixture<PageMigrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageMigrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageMigrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
