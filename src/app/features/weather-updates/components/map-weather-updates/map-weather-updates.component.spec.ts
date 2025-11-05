import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapWeatherUpdatesComponent } from './map-weather-updates.component';

describe('MapWeatherUpdatesComponent', () => {
  let component: MapWeatherUpdatesComponent;
  let fixture: ComponentFixture<MapWeatherUpdatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapWeatherUpdatesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapWeatherUpdatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
