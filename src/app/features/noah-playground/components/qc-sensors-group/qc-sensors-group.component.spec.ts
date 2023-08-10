import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QcSensorsGroupComponent } from './qc-sensors-group.component';

describe('QcSensorsGroupComponent', () => {
  let component: QcSensorsGroupComponent;
  let fixture: ComponentFixture<QcSensorsGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QcSensorsGroupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QcSensorsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
