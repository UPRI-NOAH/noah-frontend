import { Component, OnInit } from '@angular/core';
import { PraService } from '@features/personalized-risk-assessment/services/pra.service';
import { RiskService } from '@features/personalized-risk-assessment/services/risk.service';
import { SampleMarker } from '@shared/mocks/critical-facilities';
import { Observable, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'noah-critical-facilities',
  templateUrl: './critical-facilities.component.html',
  styleUrls: ['./critical-facilities.component.scss'],
})
export class CriticalFacilitiesComponent implements OnInit {
  currentLocation$: Observable<string>;
  criticalFacilities = [];
  private _unsub = new Subject();

  constructor(
    private praService: PraService,
    private riskService: RiskService
  ) {}

  ngOnInit(): void {
    this.currentLocation$ = this.praService.currentLocation$;
    this.praService.setCurrentPage('critical-facilities');

    this.praService.currentCoords$
      .pipe(
        switchMap((coords) => this.riskService.getCriticalFacilities(coords)),
        takeUntil(this._unsub)
      )
      .subscribe(
        (criticalFacilities) => (this.criticalFacilities = criticalFacilities)
      );
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  focus(marker: SampleMarker) {
    const coords = {
      lat: (<[number, number]>marker.coords)[1],
      lng: (<[number, number]>marker.coords)[0],
    };
    this.praService.setMapCenter(coords);
  }
}
