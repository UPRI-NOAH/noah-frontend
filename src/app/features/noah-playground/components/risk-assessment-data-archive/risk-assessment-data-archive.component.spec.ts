import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskAssessmentDataArchiveComponent } from './risk-assessment-data-archive.component';

describe('RiskAssessmentDataArchiveComponent', () => {
  let component: RiskAssessmentDataArchiveComponent;
  let fixture: ComponentFixture<RiskAssessmentDataArchiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskAssessmentDataArchiveComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAssessmentDataArchiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
