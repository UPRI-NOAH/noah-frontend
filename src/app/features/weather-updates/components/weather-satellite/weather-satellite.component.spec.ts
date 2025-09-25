import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherSatelliteComponent } from './weather-satellite.component';

describe('WeatherSatelliteComponent', () => {
  let component: WeatherSatelliteComponent;
  let fixture: ComponentFixture<WeatherSatelliteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WeatherSatelliteComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WeatherSatelliteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
