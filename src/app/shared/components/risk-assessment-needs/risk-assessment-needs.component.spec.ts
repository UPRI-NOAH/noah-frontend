import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskAssessmentNeedsComponent } from './risk-assessment-needs.component';

describe('RiskAssessmentNeedsComponent', () => {
  let component: RiskAssessmentNeedsComponent;
  let fixture: ComponentFixture<RiskAssessmentNeedsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskAssessmentNeedsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAssessmentNeedsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
