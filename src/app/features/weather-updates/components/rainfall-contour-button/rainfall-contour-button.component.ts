import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
import {
  RainfallContourTypes,
  TemperatureForecastDay,
  TemperatureType,
  TEMPERATURE,
  TEMPERATURE_FORECAST_DAYS,
} from '@features/weather-updates/store/weather-updates.store';
import { Observable, Subject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'noah-rainfall-contour-button',
  templateUrl: './rainfall-contour-button.component.html',
  styleUrls: ['./rainfall-contour-button.component.scss'],
})
export class RainfallContourButtonComponent implements OnInit {
  @Input() label: string;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  @Input() initialValue: number = 100;

  @Output() valueChange = new EventEmitter();

  sliderCtrl: FormControl;
  private _unsub = new Subject();
  initialOpacityValue: number = 100;

  rainfallContourTypes: RainfallContourTypes[] = [
    '1hr',
    '3hr',
    '6hr',
    '12hr',
    '24hr',
    'forecast',
  ];

  labelRainfallContourTypes: string[] = [];
  activeRainfallContourType: RainfallContourTypes = '1hr';
  shown$: Observable<boolean>;
  selectedRainfallContourType$: Observable<RainfallContourTypes>;
  weatherTypes = [];
  temperatureTypes = TEMPERATURE;
  isTemperatureActive = false;
  activeTemperatureType: TemperatureType = 'heat_index';

  caption$: Observable<string>;
  isLoading$: Observable<boolean>;

  // Temperature observables
  selectedTemperature$: Observable<TemperatureType>;
  selectedTemperatureForecastDay$: Observable<TemperatureForecastDay>;
  temperatureShown$: Observable<boolean>;
  temperatureExpanded$: Observable<boolean>;

  // Forecast days for temperature
  temperatureForecastDays = TEMPERATURE_FORECAST_DAYS;

  constructor(
    private wuService: WeatherUpdatesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sliderCtrl = new FormControl(this.initialValue);
    this.sliderCtrl.valueChanges
      .pipe(takeUntil(this._unsub))
      .subscribe((v) => this.valueChange.emit(v));

    this.selectedRainfallContourType$ =
      this.wuService.selectedRainfallContourType$;

    this.labelRainfallContourTypes = this.rainfallContourTypes.map((item) => {
      const number = item.replace(/[^0-9]/g, '');
      const label = +number === 1 ? 'hour' : 'hours';
      return `${number} ${label}`;
    });

    // --- Make slider reactive to store changes ---
    this.selectedRainfallContourType$
      .pipe(
        switchMap((type) =>
          this.wuService
            .getRainfallContour$(type)
            .pipe(map((state) => ({ type, opacity: state.opacity })))
        ),
        takeUntil(this._unsub)
      )
      .subscribe(({ type, opacity }) => {
        this.activeRainfallContourType = type;
        if (!this.isTemperatureActive) {
          this.sliderCtrl.setValue(opacity, { emitEvent: false });
        }
      });

    // Initialize temperature observables
    this.selectedTemperature$ = this.wuService.selectedTemperature$;
    this.selectedTemperatureForecastDay$ =
      this.wuService.selectedTemperatureForecastDay$;
    this.temperatureShown$ = this.wuService.temperatureShown$;
    this.temperatureExpanded$ = this.wuService.temperatureExpanded$;

    this.temperatureShown$.pipe(takeUntil(this._unsub)).subscribe((shown) => {
      this.isTemperatureActive = shown;
      if (shown) {
        this.sliderCtrl.setValue(
          this.wuService.getTemperatureOpacity(this.activeTemperatureType),
          { emitEvent: false }
        );
      }
    });

    this.selectedTemperature$.pipe(takeUntil(this._unsub)).subscribe((type) => {
      this.activeTemperatureType = type;
      if (this.isTemperatureActive) {
        this.sliderCtrl.setValue(this.wuService.getTemperatureOpacity(type), {
          emitEvent: false,
        });
      }
    });
  }

  selectRainfallContourType(type: RainfallContourTypes) {
    this.router.navigateByUrl('/weather-updates/rainfall-contour');
    this.isTemperatureActive = false;
    this.activeRainfallContourType = type;
    this.wuService.selectRainfallContourType(type);
    const selectedType = this.wuService.getSelectedRainfallContourType();
    this.wuService.setRainfallContourOpacity(80, selectedType);
  }

  selectActiveRainfallContourType(type: RainfallContourTypes) {
    this.isTemperatureActive = false;
    this.activeRainfallContourType = type;
    this.wuService.selectRainfallContourType(type);
  }

  getLabel(type: RainfallContourTypes): string {
    if (type === 'forecast') {
      return 'Rainfall for Tomorrow';
    }

    const number = type.replace(/[^0-9]/g, '');
    const label = +number === 1 ? 'Hour' : 'Hours';
    return `${number} ${label}`;
  }

  getLabelMobile(type: RainfallContourTypes): string {
    const number = type.replace(/[^0-9]/g, '');
    const label = +number === 1 ? 'hour' : 'hours';
    return `${label}`;
  }

  changeOpacity(event: Event): void {
    const input = event.target as HTMLInputElement;
    const opacity = Number(input.value);

    if (this.isTemperatureActive) {
      this.wuService.setTemperatureOpacity(opacity, this.activeTemperatureType);
      return;
    }

    this.wuService.setRainfallContourOpacity(
      opacity,
      this.activeRainfallContourType
    );
  }
  getMobileIcon(type: RainfallContourTypes): string {
    // e.g. 1hr -> 1hr.svg
    return `assets/images/${type}.svg`;
  }
  getDesktopIcon(type: RainfallContourTypes): string {
    // e.g. 1hr -> 1hr_bg.svg
    return `assets/images/rainfall-logo.svg`;
  }
  getContourIcon(type: RainfallContourTypes): string {
    return `assets/images/rainfall-contour/final-rf-${type}.svg`;
  }

  // Temperature-related methods
  /**
   * Toggle temperature group visibility when forecast is selected
   */
  toggleTemperatureVisibility(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    this.wuService.toggleTemperatureGroupVisibility();
  }

  /**
   * Select temperature forecast day
   */
  selectTemperatureForecastDay(day: TemperatureForecastDay): void {
    this.wuService.selectTemperatureForecastDay(day);
  }

  /**
   * Select temperature type (heat_index or max_temperature)
   */
  selectTemperatureType(tempType: TemperatureType): void {
    this.router.navigateByUrl('/weather-updates/temperature');
    this.wuService.enableTemperature();
    const tempSelected = this.wuService.getTemperatureType();
    this.wuService.setTemperatureOpacity(80, tempSelected);
    this.isTemperatureActive = true;
    this.activeTemperatureType = tempType;
    this.wuService.selectTemperatureType(tempType);
    this.sliderCtrl.setValue(this.wuService.getTemperatureOpacity(tempType), {
      emitEvent: false,
    });
  }

  /**
   * Get temperature display label
   */
  getTemperatureLabel(tempType: TemperatureType): string {
    return tempType.replace(/_/g, ' ');
  }

  /**
   * Show temperature when forecast rainfall is selected
   */
  onForecastRainfallSelected(): void {
    this.selectRainfallContourType('forecast');
    // Auto-show temperature when forecast is selected
    this.wuService.toggleTemperatureGroupVisibility();
  }
}
