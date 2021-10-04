import { Component, OnInit } from '@angular/core';
import {
  CriticalFacilityFeature,
  HazardsService,
  MapItem,
} from '@features/know-your-hazards/services/hazards.service';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { Observable, Subject } from 'rxjs';
import { SampleMarker } from '@shared/mocks/critical-facilities';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';

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

    this.kyhService.criticalFacilities$
      .pipe(
        map((featureCollection) =>
          this._getCriticalFacility(
            featureCollection.features as CriticalFacilityFeature[]
          )
        )
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
    this.kyhService.setCurrentCoords(coords);
  }

  private _getCriticalFacility(
    featureList: CriticalFacilityFeature[]
  ): MapItem[] {
    const getType = (layerName: string) => {
      switch (layerName) {
        case 'fire_station':
          return 'fire-station';
        case 'hospitals':
          return 'hospital';
        case 'police_station':
          return 'police-station';
        case 'schools':
          return 'school';
        default:
          throw new Error('critical facility layer not found!');
      }
    };

    return featureList.map((feature) => ({
      coords: feature.geometry.coordinates,
      name: feature.properties.name,
      type: getType(feature.properties.tilequery.layer),
      distance: feature.properties.tilequery.distance / 1000, // to km
    }));
  }
}
