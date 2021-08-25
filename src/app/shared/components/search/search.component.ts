import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MapService } from '@core/services/map.service';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { UP_ARROW, DOWN_ARROW, ENTER } from '@angular/cdk/keycodes';
import { userCoords } from '@features/know-your-hazards/store/kyh.store';
@Component({
  selector: 'noah-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  center: [number, number];
  @Input() searchTerm: string;
  @Output() selectPlace: EventEmitter<any> = new EventEmitter();
  currentLocation$: Observable<string>;
  searchTermCtrl: FormControl;
  places$: BehaviorSubject<any[]>;

  placeHolder: string = '';
  isExist = false;
  kyhPlaceholder: string;

  isDropdownOpen = false;
  isCurrent = false;

  constructor(
    private mapService: MapService,
    private kyhService: KyhService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.kyhService.init();
    this.placeHolder = this.kyhService.allPlaceHolder;

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

  userFixedLocation() {
    // HERE GETTING USER COORDINATES THEN PARSE TO LOCAL STORAGE
    function locationSuccess(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const coords = { lng: longitude, lat: latitude };
      localStorage.setItem('userLocation', JSON.stringify(coords));
      const retrievedObject = localStorage.getItem('userLocation');
      console.log('retrievedObject: ', JSON.parse(retrievedObject));
    }

    function locationError(error) {
      const message = error.message;
      alert(message);
    }
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError);

    //GETTING COORDINATES TO LOCAL STORAGE
    const user = localStorage.getItem('userLocation');
    const userCoords = JSON.parse(user);
    const myPlace = [userCoords.lng, userCoords.lat];
    console.log(myPlace);
    this.router.navigate(['/know-your-hazards']);
    return {
      center: myPlace,
    };
  }

  pickPlace(place) {
    this.searchTermCtrl.setValue(place.text);
    this.isDropdownOpen = false;
    this.selectPlace.emit(place);
  }

  onKeydown(event) {
    if (event.keyCode === DOWN_ARROW) {
      this.searchTermCtrl.setValue([userCoords.lng, userCoords.lat]);
      console.log('Down', event.keyCode);
    } else if (event.keyCode === UP_ARROW) {
      // this.dropdownNotActive()
      console.log('Up', event.keyCode);
    } else if (event.keyCode === ENTER) {
      console.log('Enter', event.keyCode);
    }
  }
}
