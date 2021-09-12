import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { WeatherState } from '@features/noah-playground/store/noah-playground.store';

@Component({
  selector: 'noah-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss'],
})
export class WeatherComponent implements OnInit {
  weather: WeatherState;

  get expanded(): boolean {
    return this.weather.expanded;
  }

  get opacity(): number {
    return this.weather.opacity;
  }

  get shown(): boolean {
    return this.weather.shown;
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    // The only time we get the value from the state directly is when we're
    // initializing the value
    this.weather = this.pgService.getWeather();
  }

  changeExaggerationLevel(opacity: number) {
    this.weather = {
      ...this.weather,
      opacity,
    };

    this.pgService.setWeather(this.weather);
  }

  toggleExpand() {
    const expanded = !this.expanded;
    this.weather = {
      ...this.weather,
      expanded: expanded,
    };

    this.pgService.setWeather(this.weather);
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    const shown = !this.shown;
    this.weather = {
      ...this.weather,
      shown,
    };

    this.pgService.setWeather(this.weather);
  }
}
