import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MapService } from '@core/services/map.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';

type FixedMyLocation = {
  center: [number, number];
  place_name: string;
};
@Component({
  selector: 'noah-landing-page',
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent implements OnInit {
  @Input() searchTerm: string;
  @Output() selectPlace: EventEmitter<any> = new EventEmitter();

  searchTermCtrl: FormControl;
  places$: BehaviorSubject<any[]>;

  isDropdownOpen = false;

  constructor(private mapService: MapService, private kyhService: KyhService) {}

  ngOnInit(): void {
    this.kyhService.init();
    this.searchTermCtrl = new FormControl();
    this.places$ = new BehaviorSubject([]);

    this.searchTermCtrl.valueChanges
      .pipe(
        tap((searchText) => {
          if (!searchText?.length) {
            this.isDropdownOpen = false;
            this.places$.next([]);
          }
        }),
        debounceTime(300),
        filter((searchText) => searchText && this.isDropdownOpen),
        switchMap((searchText) => this.mapService.forwardGeocode(searchText))
      )
      .subscribe((value: any) => {
        this.places$.next(value.features);
      });
  }

  get fixedMyLocation(): FixedMyLocation {
    // GETTING USER COORDINATES THEN PARSE TO LOCAL STORAGE
    function locationSuccess(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const coords = { lng: longitude, lat: latitude };
      localStorage.setItem('userLocation', JSON.stringify(coords));
      const retrievedObject = localStorage.getItem('coords');
      console.log('retrievedObject: ', JSON.parse(retrievedObject));
    }
    function locationError(error) {
      const message = error.message;
      alert(message);
    }
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
    //GETTING COORDINATES FROM LOCAL STORAGE
    const user = localStorage.getItem('userLocation');
    const userCoords = JSON.parse(user);
    console.log(userCoords.lng);
    console.log(userCoords.lat);
    return {
      center: [userCoords.lng, userCoords.lat],
      place_name: 'Your Current Location',
    };
  }

  pickPlace(place) {
    this.searchTermCtrl.setValue(place.text);
    this.isDropdownOpen = false;
    this.selectPlace.emit(place);
    console.log(place);

    //fly to
    this.kyhService.setCurrentLocation(place.text);
    const [lng, lat] = place.center;
    this.kyhService.setCenter({ lat, lng });
    this.kyhService.setCurrentCoords({ lat, lng });
  }
  gotoTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
}
