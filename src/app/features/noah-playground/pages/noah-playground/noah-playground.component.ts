import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { HAZARDS } from '@shared/mocks/hazard-types-and-levels';
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
  isList;
  hazardTypes = HAZARDS;

  constructor(private pgService: NoahPlaygroundService, private title: Title) {}

  ngOnInit(): void {
    this.currentLocationPg$ = this.pgService.currentLocation$;
    this.title.setTitle('NOAH Studio');
  }

  selectPlace(selectedPlace) {
    this.pgService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.pgService.setCenter({ lat, lng });
  }
}
