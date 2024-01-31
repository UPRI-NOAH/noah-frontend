import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskAssessmentGroupComponent } from './risk-assessment-group.component';

describe('RiskAssessmentGroupComponent', () => {
  let component: RiskAssessmentGroupComponent;
  let fixture: ComponentFixture<RiskAssessmentGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskAssessmentGroupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAssessmentGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
