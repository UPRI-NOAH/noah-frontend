import { Component, OnInit } from '@angular/core';
import { HazardsService } from '@features/know-your-hazards/services/hazards.service';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { Observable, Subject } from 'rxjs';
import { SampleMarker } from '@shared/mocks/critical-facilities';
import { switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'noah-critical-facilities-kyh',
  templateUrl: './critical-facilities-kyh.component.html',
  styleUrls: ['./critical-facilities-kyh.component.scss'],
})
export class CriticalFacilitiesKyhComponent implements OnInit {
  currentLocation$: Observable<String>;
  criticalFacilities = [];
  private _unsub = new Subject();

  constructor(
    private kyhService: KyhService,
    private hazardService: HazardsService
  ) {}

  ngOnInit(): void {
    this.currentLocation$ = this.kyhService.currentLocation$;
    this.kyhService.setCurrentPage('know-your-hazards');

    this.kyhService.currentCoords$
      .pipe(
        switchMap((coords) => this.hazardService.getCriticalFacilities(coords)),
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
    this.kyhService.setMapCenter(coords);
  }
}
