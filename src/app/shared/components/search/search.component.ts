import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MapService } from '@core/services/map.service';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';

type FixedMyLocation = {
  center: [number, number];
  place_name: string;
};
@Component({
  selector: 'noah-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  @Input() searchTerm: string;
  @Output() selectPlace: EventEmitter<any> = new EventEmitter();
  currentLocation$: Observable<string>;

  searchTermCtrl: FormControl;
  places$: BehaviorSubject<any[]>;

  isDropdownOpen = false;
  isCurrent = false;

  constructor(private mapService: MapService, private kyhService: KyhService) {}

  ngOnInit(): void {
    this.kyhService.init();
    this.searchTermCtrl = new FormControl();
    this.places$ = new BehaviorSubject([]);
    this.currentLocation$ = this.kyhService.currentLocation$;

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
    // HERE GETTING USER COORDINATES THEN PARSE TO LOCAL STORAGE
    function locationSuccess(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      var coords = { lng: longitude, lat: latitude };
      localStorage.setItem('userLocation', JSON.stringify(coords));
      var retrievedObject = localStorage.getItem('coords');
      console.log('retrievedObject: ', JSON.parse(retrievedObject));
    }

    function locationError(error) {
      const code = error.code;
      const message = error.message;

      // read the code and message and decide how you want to handle this!
      alert(message);
    }

    navigator.geolocation.getCurrentPosition(locationSuccess, locationError);

    //GETTING COORDINATES TO LOCAL STORAGE
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
  }

  // selectPlace(selectedPlace) {
  //   this.kyhService.setCurrentLocation(selectedPlace.text);
  //   const [lng, lat] = selectedPlace.center;
  //   this.kyhService.setCenter({ lat, lng });
  //   this.kyhService.setCurrentCoords({ lat, lng });
  // }
}
