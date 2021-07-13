import { Component, Input, OnInit } from '@angular/core';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import {
  HazardType,
  KYHPage,
  RiskLevel,
} from '@features/know-your-hazards/store/kyh.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-know-your-hazards',
  templateUrl: './know-your-hazards.component.html',
  styleUrls: ['./know-your-hazards.component.scss'],
})
export class KnowYourHazardsComponent implements OnInit {
  searchTerm: string;
  currentLocation$: Observable<string>;
  floodRiskLevel$: Observable<RiskLevel>;
  stormsurgeRiskLevel$: Observable<RiskLevel>;
  landslideRiskLevel$: Observable<RiskLevel>;
  currentHazard$: Observable<HazardType>;
  isFlood: boolean = false;
  islandSlide: boolean = false;
  isStorm: boolean = false;

  constructor(private kyhService: KyhService) {
    this.floodRiskLevel$ = this.kyhService.floodRiskLevel$;
    this.stormsurgeRiskLevel$ = this.kyhService.stormsurgeRiskLevel$;
    this.landslideRiskLevel$ = this.kyhService.landslideRiskLevel$;
    this.currentHazard$ = this.kyhService.currentHazard$;
  }

  ngOnInit(): void {
    this.kyhService.init();
    this.kyhService.setCurrentPage('know-your-hazards');
    this.currentLocation$ = this.kyhService.currentLocation$;
  }
  viewHazardLayer(currentHazard: HazardType) {
    this.kyhService.setCurrentHazard(currentHazard);
  }
  // viewAllLayer(currentPage: KYHPage) {
  //   console.log(currentPage);
  //   this.kyhService.init();
  //   this.kyhService.setCurrentPage(currentPage);
  // }
  selectPlace(selectedPlace) {
    this.kyhService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.kyhService.setCenter({ lat, lng });
    this.kyhService.setCurrentCoords({ lat, lng });
  }
}
