import { Component, OnInit } from '@angular/core';
import { PraService } from '@features/personalized-risk-assessment/services/pra.service';
import { MARKERS, SampleMarker } from '@shared/mocks/critical-facilities';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-critical-facilities',
  templateUrl: './critical-facilities.component.html',
  styleUrls: ['./critical-facilities.component.scss'],
})
export class CriticalFacilitiesComponent implements OnInit {
  currentLocation$: Observable<string>;
  criticalFacilities = MARKERS;

  constructor(private praService: PraService) {}

  ngOnInit(): void {
    this.currentLocation$ = this.praService.currentLocation$;
    this.praService.setCurrentPage('critical-facilities');
  }

  focus(marker: SampleMarker) {
    const coords = {
      lat: (<[number, number]>marker.coords)[1],
      lng: (<[number, number]>marker.coords)[0],
    };
    this.praService.setMapCenter(coords);
  }
}
