import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskAssessmentSummaryComponent } from './risk-assessment-summary.component';

describe('RiskAssessmentSummaryComponent', () => {
  let component: RiskAssessmentSummaryComponent;
  let fixture: ComponentFixture<RiskAssessmentSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskAssessmentSummaryComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAssessmentSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
