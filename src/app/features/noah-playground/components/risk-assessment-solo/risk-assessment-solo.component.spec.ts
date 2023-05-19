import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskAssessmentSoloComponent } from './risk-assessment-solo.component';

describe('RiskAssessmentSoloComponent', () => {
  let component: RiskAssessmentSoloComponent;
  let fixture: ComponentFixture<RiskAssessmentSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskAssessmentSoloComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAssessmentSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
