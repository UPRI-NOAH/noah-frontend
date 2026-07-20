import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskAssessmentNewModalComponent } from './risk-assessment-new-modal.component';

describe('RiskAssessmentNewModalComponent', () => {
  let component: RiskAssessmentNewModalComponent;
  let fixture: ComponentFixture<RiskAssessmentNewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskAssessmentNewModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAssessmentNewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
