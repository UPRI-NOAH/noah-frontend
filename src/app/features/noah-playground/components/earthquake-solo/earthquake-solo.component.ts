import { Component, Input, OnInit } from '@angular/core';
import { EarthquakeType } from '@features/noah-playground/services/earthquake-data.service';
import { ModalService } from '@features/noah-playground/services/modal.service';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'noah-earthquake-solo',
  templateUrl: './earthquake-solo.component.html',
  styleUrls: ['./earthquake-solo.component.scss'],
})
export class EarthquakeSoloComponent implements OnInit {
  @Input() earthquakeSensorType: EarthquakeType;

  shown$: Observable<boolean>;
  fetchFailed: boolean;

  private _unsub = new Subject();

  get displayName(): string {
    return this.earthquakeSensorType.replace('-', ' ');
  }

  constructor(
    private pgService: NoahPlaygroundService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.shown$ = this.pgService.getEarthquakeSensorTypeShown$(
      this.earthquakeSensorType
    );
    this.pgService
      .getEarthquakeSensorTypeFetched$(this.earthquakeSensorType)
      .pipe(takeUntil(this._unsub))
      .subscribe((fetched) => {
        this.fetchFailed = !fetched;
      });
  }

  simulateData() {
    this.modalService.simulateBtnClick();
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  toggleShown() {
    if (this.fetchFailed) return;
    this.pgService.setEarthquakeSensorTypeShown(this.earthquakeSensorType);
  }
}
