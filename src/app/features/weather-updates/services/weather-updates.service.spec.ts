import { TestBed } from '@angular/core/testing';

import { WeatherUpdatesService } from './weather-updates.service';

describe('WeatherUpdatesService', () => {
  let service: WeatherUpdatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WeatherUpdatesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
