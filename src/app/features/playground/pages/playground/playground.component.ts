import { Component, OnInit } from '@angular/core';
import { PlaygroundService } from '@features/playground/services/playground.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss'],
})
export class PlaygroundComponent implements OnInit {
  currentLocationPg$: Observable<string>;
  searchTerm: string;

  constructor(private playgroundService: PlaygroundService) {}

  ngOnInit(): void {
    this.currentLocationPg$ = this.playgroundService.currentLocationPg$;
  }

  selectPlace(selectedPlace) {
    this.playgroundService.setCurrentLocationPg(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.playgroundService.setCenter({ lat, lng });
  }
}
