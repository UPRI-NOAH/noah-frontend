import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QcSensorSoloComponent } from './qc-sensor-solo.component';

describe('QcSensorSoloComponent', () => {
  let component: QcSensorSoloComponent;
  let fixture: ComponentFixture<QcSensorSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QcSensorSoloComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QcSensorSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
