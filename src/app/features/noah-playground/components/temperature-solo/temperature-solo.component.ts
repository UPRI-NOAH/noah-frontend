import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { TemperatureType } from '@features/noah-playground/store/noah-playground.store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'noah-temperature-solo',
  templateUrl: './temperature-solo.component.html',
  styleUrls: ['./temperature-solo.component.scss'],
})
export class TemperatureSoloComponent implements OnInit {
  @Input() tempName: TemperatureType;

  selectedTemperature$: Observable<TemperatureType>;
  fetchFailed: boolean = false;

  initialOpacityValue: number = 30;
  private _unsub = new Subject();

  get displayName(): string {
    return this.tempName.replace('_', ' ');
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.selectedTemperature$ = this.pgService.selectedTemperature$;
    this.initialOpacityValue = this.pgService.getTemperatureOpacity(
      this.tempName
    );

    // this.pgService.getTemperatureFetched$(this.tempName).pipe(takeUntil(this._unsub))
    // .subscribe((fetched) => {
    //   this.fetchFailed = !fetched
    // })
  }

  changeOpacity(opacity: number) {
    this.pgService.setTemperatureOpacity(opacity, this.tempName);
  }

  selectTemperature(tempType: TemperatureType) {
    this.pgService.selectTemperatureType(tempType);
  }
}
