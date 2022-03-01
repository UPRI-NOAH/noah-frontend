import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import {
  ExposureLevel,
  HazardType,
} from '@features/know-your-hazards/store/kyh.store';
import { combineLatest, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'noah-hazard-button',
  templateUrl: './hazard-button.component.html',
  styleUrls: ['./hazard-button.component.scss'],
})
export class HazardButtonComponent implements OnInit {
  @Input() hazardType: HazardType;

  caption$: Observable<string>;
  exposureLevel$: Observable<ExposureLevel>;
  isLoading$: Observable<boolean>;

  constructor(private kyhService: KyhService, private router: Router) {}

  ngOnInit(): void {
    this.exposureLevel$ = this.kyhService
      .getExposureLevel$(this.hazardType)
      .pipe(shareReplay(1));
    this.isLoading$ = this.kyhService.isLoading$.pipe(shareReplay(1));
    this.caption$ = this._getCaption$();
  }

  buttonAction() {
    this.router.navigateByUrl(`/know-your-hazards/${this.hazardType}`);
  }

  private _getCaption$(): Observable<string> {
    return combineLatest([this.isLoading$, this.exposureLevel$]).pipe(
      map(([isLoading, exposureLevel]) =>
        !isLoading && exposureLevel === 'unavailable'
          ? 'Hazard maps in this area are not yet complete.'
          : ''
      )
    );
  }
}
