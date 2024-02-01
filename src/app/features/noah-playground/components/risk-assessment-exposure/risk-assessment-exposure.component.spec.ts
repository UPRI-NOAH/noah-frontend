import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskAssessmentExposureComponent } from './risk-assessment-exposure.component';

describe('RiskAssessmentExposureComponent', () => {
  let component: RiskAssessmentExposureComponent;
  let fixture: ComponentFixture<RiskAssessmentExposureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskAssessmentExposureComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAssessmentExposureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
