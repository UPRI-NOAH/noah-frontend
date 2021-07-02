import { Component, OnInit } from '@angular/core';
import { PlaygroundService } from '@features/playground/services/playground.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-noah-playground',
  templateUrl: './noah-playground.component.html',
  styleUrls: ['./noah-playground.component.scss'],
})
export class NoahPlaygroundComponent implements OnInit {
  currentLocationPg$: Observable<string>;
  searchTerm: string;

  isSidebarOpen: boolean = false;
  isMenu: boolean = true;

  isOpenedList: boolean = true;

  constructor(private playgroundService: PlaygroundService) {}

  ngOnInit(): void {
    this.currentLocationPg$ = this.playgroundService.currentLocationPg$;
  }

  openMenu() {
    this.isOpenedList = true;
  }

  closeMenu() {
    this.isOpenedList = false;
  }

  getSliderValue(event) {
    console.log(event.target.value);
  }

  selectPlace(selectedPlace) {
    this.playgroundService.setCurrentLocationPg(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.playgroundService.setCenter({ lat, lng });
  }
}
