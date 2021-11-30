import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherSatellitePlaygroundComponent } from './weather-satellite-playground.component';

describe('WeatherSatellitePlaygroundComponent', () => {
  let component: WeatherSatellitePlaygroundComponent;
  let fixture: ComponentFixture<WeatherSatellitePlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WeatherSatellitePlaygroundComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WeatherSatellitePlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
