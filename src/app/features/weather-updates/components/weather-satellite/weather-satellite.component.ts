import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
import { WeatherSatelliteType } from '@features/weather-updates/store/weather-updates.store';
import { Observable, Subject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'noah-weather-satellite',
  templateUrl: './weather-satellite.component.html',
  styleUrls: ['./weather-satellite.component.scss'],
})
export class WeatherSatelliteComponent implements OnInit {
  @Input() name: WeatherSatelliteType;
  @Input() label: string;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  @Input() initialValue: number = 100;

  isSelected: boolean = false;
  selectedWeatherSatellite$: Observable<WeatherSatelliteType>;
  sliderCtrl: FormControl;
  private _unsub = new Subject();

  constructor(private wuService: WeatherUpdatesService) {}

  ngOnInit(): void {
    this.selectedWeatherSatellite$ = this.wuService.selectedWeatherSatellite$;
    this.sliderCtrl = new FormControl(
      this.wuService.getWeatherSatelliteOpacity(this.name)
    );

    this.selectedWeatherSatellite$
      .pipe(takeUntil(this._unsub))
      .subscribe((selected) => {
        this.isSelected = selected === this.name;
      });

    this.sliderCtrl.valueChanges
      .pipe(takeUntil(this._unsub))
      .subscribe((v) => this.changeOpacity(v));
  }

  selectSatellite() {
    this.wuService.selectWeatherSatelliteType(this.name);
  }

  changeOpacity(opacity: number): void {
    this.wuService.setWeatherSatelliteOpacity(opacity, this.name);
  }

  ngOnDestroy() {
    this._unsub.next();
    this._unsub.complete();
  }
}
