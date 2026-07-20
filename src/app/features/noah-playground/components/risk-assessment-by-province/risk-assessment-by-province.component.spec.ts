import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskAssessmentByProvinceComponent } from './risk-assessment-by-province.component';

describe('RiskAssessmentByProvinceComponent', () => {
  let component: RiskAssessmentByProvinceComponent;
  let fixture: ComponentFixture<RiskAssessmentByProvinceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskAssessmentByProvinceComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAssessmentByProvinceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
