import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorSoloComponent } from './sensor-solo.component';

describe('SensorSoloComponent', () => {
  let component: SensorSoloComponent;
  let fixture: ComponentFixture<SensorSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SensorSoloComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SensorSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
