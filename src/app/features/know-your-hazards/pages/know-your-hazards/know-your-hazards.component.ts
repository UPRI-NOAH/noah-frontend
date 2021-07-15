import { Component, Input, OnInit } from '@angular/core';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import {
  HazardType,
  KYHPage,
  RiskLevel,
} from '@features/know-your-hazards/store/kyh.store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'noah-know-your-hazards',
  templateUrl: './know-your-hazards.component.html',
  styleUrls: ['./know-your-hazards.component.scss'],
})
export class KnowYourHazardsComponent implements OnInit {
  searchTerm: string;
  currentLocation$: Observable<string>;
  floodRiskLevel$: Observable<RiskLevel>;
  stormSurgeRiskLevel$: Observable<RiskLevel>;
  landslideRiskLevel$: Observable<RiskLevel>;

  get isKYHPage$(): Observable<boolean> {
    return this.kyhService.currentPage$.pipe(
      map((page) => page === 'know-your-hazards')
    );
  }

  get isFlood$(): Observable<boolean> {
    return this.kyhService.currentPage$.pipe(map((page) => page === 'flood'));
  }

  get isLandSlide$(): Observable<boolean> {
    return this.kyhService.currentPage$.pipe(
      map((page) => page === 'landslide')
    );
  }

  get isStormSurge$(): Observable<boolean> {
    return this.kyhService.currentPage$.pipe(
      map((page) => page === 'storm-surge')
    );
  }

  constructor(private kyhService: KyhService) {
    this.floodRiskLevel$ = this.kyhService.floodRiskLevel$;
    this.stormSurgeRiskLevel$ = this.kyhService.stormSurgeRiskLevel$;
    this.landslideRiskLevel$ = this.kyhService.landslideRiskLevel$;
  }

  ngOnInit(): void {
    this.kyhService.init();
    this.kyhService.setCurrentPage('know-your-hazards');
    this.currentLocation$ = this.kyhService.currentLocation$;
  }

  viewHazardLayer(currentHazard: HazardType) {
    this.kyhService.setCurrentHazard(currentHazard);
    this.kyhService.setCurrentPage(currentHazard);
  }

  selectPlace(selectedPlace) {
    this.kyhService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.kyhService.setCenter({ lat, lng });
    this.kyhService.setCurrentCoords({ lat, lng });
  }
}
