import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskAssessmentRainComponent } from './risk-assessment-rain.component';

describe('RiskAssessmentRainComponent', () => {
  let component: RiskAssessmentRainComponent;
  let fixture: ComponentFixture<RiskAssessmentRainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskAssessmentRainComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAssessmentRainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
