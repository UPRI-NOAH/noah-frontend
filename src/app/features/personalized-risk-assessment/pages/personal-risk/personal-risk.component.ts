import { Component, OnInit } from '@angular/core';
import { PraService } from '@features/personalized-risk-assessment/services/pra.service';

@Component({
  selector: 'noah-personal-risk',
  templateUrl: './personal-risk.component.html',
  styleUrls: ['./personal-risk.component.scss'],
})
export class PersonalRiskComponent implements OnInit {
  searchTerm: string;

  constructor(private praService: PraService) {}

  ngOnInit(): void {
    this.praService.init();
  }
  selectPlace(selectedPlace) {
    this.praService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.praService.setCenter({ lat, lng });
  }
}
