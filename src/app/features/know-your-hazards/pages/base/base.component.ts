import { Component, OnInit } from '@angular/core';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
})
export class BaseComponent implements OnInit {
  currentLocation$: Observable<string>;
  currentPage: number = 1;

  constructor(private kyhService: KyhService) {}

  ngOnInit(): void {
    this.currentLocation$ = this.kyhService.currentLocation$;
  }

  selectPlace(selectedPlace) {
    this.kyhService.setCurrentLocation(
      selectedPlace.text ||
        selectedPlace.place_name ||
        selectedPlace.properties?.name || // display on search results
        selectedPlace.properties?.full_address
    );

    // Handle both Geocoding API (.center) and Searchbox API (.geometry.coordinates)
    const coords = selectedPlace.center || selectedPlace.geometry?.coordinates;

    if (!coords) {
      console.error('No coordinates found in selected place:', selectedPlace);
      return;
    }

    const [lng, lat] = coords;
    this.kyhService.setCenter({ lat, lng });
    this.kyhService.setCurrentCoords({ lat, lng });
  }

  changePage() {
    if (this.currentPage == 1) {
      this.currentPage = 2;
    } else {
      this.currentPage = 1;
    }
  }
}
