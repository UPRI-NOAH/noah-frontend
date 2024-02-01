import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskAssessmentModalComponent } from './risk-assessment-modal.component';

describe('RiskAssessmentModalComponent', () => {
  let component: RiskAssessmentModalComponent;
  let fixture: ComponentFixture<RiskAssessmentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskAssessmentModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAssessmentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
