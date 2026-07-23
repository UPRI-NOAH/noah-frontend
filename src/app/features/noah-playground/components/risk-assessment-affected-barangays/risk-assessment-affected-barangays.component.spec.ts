import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskAssessmentAffectedBarangaysComponent } from './risk-assessment-affected-barangays.component';

describe('RiskAssessmentAffectedBarangaysComponent', () => {
  let component: RiskAssessmentAffectedBarangaysComponent;
  let fixture: ComponentFixture<RiskAssessmentAffectedBarangaysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskAssessmentAffectedBarangaysComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAssessmentAffectedBarangaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
