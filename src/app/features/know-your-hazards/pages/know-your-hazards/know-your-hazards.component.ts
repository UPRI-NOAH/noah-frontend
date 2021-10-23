import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import {
  HazardType,
  RiskLevel,
} from '@features/know-your-hazards/store/kyh.store';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
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
  isMenu: boolean = true;
  isOpen: boolean = true;
  isList;
  isLoading$: Observable<boolean>;

  get isKYHPage$(): Observable<boolean> {
    return this.kyhService.currentPage$.pipe(
      map((page) => page === 'know-your-hazards')
    );
  }

  get floodCaption$(): Observable<string> {
    return this.floodRiskLevel$.pipe(
      map((val) =>
        val === 'unavailable'
          ? 'Flood hazard maps in this area is not yet complete.'
          : ''
      )
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

  constructor(
    private gaService: GoogleAnalyticsService,
    private kyhService: KyhService,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.title.setTitle('NOAH - Know Your Hazards');
    this.floodRiskLevel$ = this.kyhService.floodRiskLevel$;
    this.stormSurgeRiskLevel$ = this.kyhService.stormSurgeRiskLevel$;
    this.landslideRiskLevel$ = this.kyhService.landslideRiskLevel$;
    this.isLoading$ = this.kyhService.isLoading$;

    this.kyhService.init();
    this.kyhService.setCurrentPage('know-your-hazards');
    this.currentLocation$ = this.kyhService.currentLocation$;
  }

  viewHazardLayer(currentHazard: HazardType) {
    this.gaService.event(
      'view_hazard_info',
      'know_your_hazards',
      currentHazard
    );
    this.kyhService.setCurrentPage(currentHazard);
  }

  selectPlace(selectedPlace) {
    this.kyhService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.kyhService.setCenter({ lat, lng });
    this.kyhService.setCurrentCoords({ lat, lng });
  }
}
