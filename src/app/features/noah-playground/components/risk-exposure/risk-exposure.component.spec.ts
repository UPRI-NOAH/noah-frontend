import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskExposureComponent } from './risk-exposure.component';

describe('RiskExposureComponent', () => {
  let component: RiskExposureComponent;
  let fixture: ComponentFixture<RiskExposureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskExposureComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskExposureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
