import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
import { RainfallContourTypes } from '@features/weather-updates/store/weather-updates.store';
import { Observable, Subject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';

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
  ];
  labelRainfallContourTypes: string[] = [];
  activeRainfallContourType: RainfallContourTypes = '1hr';
  shown$: Observable<boolean>;
  selectedRainfallContourType$: Observable<RainfallContourTypes>;
  weatherTypes = [];

  caption$: Observable<string>;
  isLoading$: Observable<boolean>;

  constructor(private wuService: WeatherUpdatesService) {}

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
      .pipe(takeUntil(this._unsub))
      .subscribe((type) => {
        this.wuService
          .getRainfallContour$(type)
          .pipe(takeUntil(this._unsub))
          .subscribe((state) => {
            this.sliderCtrl.setValue(state.opacity, { emitEvent: false });
          });
      });
  }

  selectRainfallContourType(type: RainfallContourTypes) {
    this.activeRainfallContourType = type;
    this.wuService.selectRainfallContourType(type);
  }

  selectActiveRainfallContourType(type: RainfallContourTypes) {
    this.activeRainfallContourType = type;
    this.wuService.selectRainfallContourType(type);
  }

  getLabel(type: RainfallContourTypes): string {
    const number = type.replace(/[^0-9]/g, '');
    const label = +number === 1 ? 'hour' : 'hours';
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
}
