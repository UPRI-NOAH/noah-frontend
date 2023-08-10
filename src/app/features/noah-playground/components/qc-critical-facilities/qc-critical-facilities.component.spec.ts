import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QcCriticalFacilitiesComponent } from './qc-critical-facilities.component';

describe('QcCriticalFacilitiesComponent', () => {
  let component: QcCriticalFacilitiesComponent;
  let fixture: ComponentFixture<QcCriticalFacilitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QcCriticalFacilitiesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QcCriticalFacilitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
