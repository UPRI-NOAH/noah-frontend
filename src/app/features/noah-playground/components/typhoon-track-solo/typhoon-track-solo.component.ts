import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  TyphoonTrackService,
  TyphoonTrackType,
} from '@features/noah-playground/services/typhoon-track.service';
import { TYPHOON_TRACK_COLORS } from '@shared/mocks/noah-colors';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export const TYPHOON_TRACK_NAMES: Record<TyphoonTrackType, string> = {
  pagasa: 'DOST-PAGASA (Philippines)',
  hko: 'HKO (Hong Kong Observatory)',
  jtwc: 'JTWC (Joint Typhoon Warning Center)',
  jma: 'JMA (Japan Meteorological Agency)',
  nmc: 'NMC (National Meteorological Center China)',
  cwa: 'CWA (Central Weather Administration Taiwan)',
  kma: 'KMA (Korea Meteorological Administration)',
};

@Component({
  selector: 'noah-typhoon-track-solo',
  templateUrl: './typhoon-track-solo.component.html',
  styleUrls: ['./typhoon-track-solo.component.scss'],
})
export class TyphoonTrackSoloComponent implements OnInit {
  @Input() typhoonTrackType: TyphoonTrackType;

  shown$: Observable<boolean>;
  fetchFailed: boolean;
  noTyphoon$ = this.typhoonService.noTyphoon$;
  noData$ = this.typhoonService.noData$;

  TYPHOON_TRACK_COLORS = TYPHOON_TRACK_COLORS;
  private _unsub = new Subject();

  get typhoonColorName(): string {
    return TYPHOON_TRACK_COLORS[this.typhoonTrackType];
  }

  get typhoonTrackTypesName(): string {
    return TYPHOON_TRACK_NAMES[this.typhoonTrackType];
  }

  constructor(
    private pgService: NoahPlaygroundService,
    private typhoonService: TyphoonTrackService
  ) {}

  ngOnInit(): void {
    this.shown$ = this.pgService.getTyphoonTrackTypeShown$(
      this.typhoonTrackType
    );

    this.pgService
      .getTyphoonTrackFetched$(this.typhoonTrackType)
      .pipe(takeUntil(this._unsub))
      .subscribe((fetched) => {
        this.fetchFailed = !fetched;
      });
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  toggleShown() {
    if (this.fetchFailed) return;
    this.pgService.setTyphoonTrackTypeShown(this.typhoonTrackType);
  }
}
