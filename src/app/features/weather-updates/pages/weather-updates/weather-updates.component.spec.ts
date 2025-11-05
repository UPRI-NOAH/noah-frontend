import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherUpdatesComponent } from './weather-updates.component';

describe('WeatherUpdatesComponent', () => {
  let component: WeatherUpdatesComponent;
  let fixture: ComponentFixture<WeatherUpdatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WeatherUpdatesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WeatherUpdatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
