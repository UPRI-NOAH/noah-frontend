import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PlaygroundService } from '@features/playground/services/playground.service';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

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

  sliderCtrl: FormControl;

  constructor(private playgroundService: PlaygroundService) {}

  ngOnInit(): void {
    this.currentLocationPg$ = this.playgroundService.currentLocationPg$;
    this.sliderCtrl = new FormControl(25);
    this.sliderCtrl.valueChanges
      .pipe(take(50))
      .subscribe((v) => console.log(v));
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
