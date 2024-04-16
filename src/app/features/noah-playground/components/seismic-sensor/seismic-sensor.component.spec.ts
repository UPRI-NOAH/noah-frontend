import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeismicSensorComponent } from './seismic-sensor.component';

describe('SeismicSensorComponent', () => {
  let component: SeismicSensorComponent;
  let fixture: ComponentFixture<SeismicSensorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SeismicSensorComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SeismicSensorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
