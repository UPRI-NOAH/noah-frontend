import { Component, OnInit, Input } from '@angular/core';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
import { TemperatureType } from '@features/weather-updates/store/weather-updates.store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'noah-wu-temperature-solo',
  templateUrl: './wu-temperature-solo.component.html',
  styleUrls: ['./wu-temperature-solo.component.scss'],
})
export class WuTemperatureSoloComponent implements OnInit {
  @Input() tempName: TemperatureType;

  selectedTemperature$: Observable<TemperatureType>;
  fetchFailed: boolean = false;

  initialOpacityValue: number = 30;
  private _unsub = new Subject();

  get displayName(): string {
    return this.tempName.replace('_', ' ');
  }

  constructor(private wuService: WeatherUpdatesService) {}

  ngOnInit(): void {
    this.selectedTemperature$ = this.wuService.selectedTemperature$;
    this.initialOpacityValue = this.wuService.getTemperatureOpacity(
      this.tempName
    );
  }

  changeOpacity(opacity: number) {
    this.wuService.setTemperatureOpacity(opacity, this.tempName);
  }

  selectTemperature(tempType: TemperatureType) {
    this.wuService.selectTemperatureType(tempType);
  }
}
