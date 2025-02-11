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
    this.kyhService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
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
