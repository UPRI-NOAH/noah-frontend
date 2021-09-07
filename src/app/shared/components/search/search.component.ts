import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MapService } from '@core/services/map.service';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { ArrowKeysDirective } from '@shared/arrow-keys.directive';
import { ENTER } from '@angular/cdk/keycodes';
import { environment } from '@env/environment';

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

  isDropdownOpen = false;
  isCurrent = false;

  column: number = 1;
  @ViewChildren(ArrowKeysDirective) inputs: QueryList<ArrowKeysDirective>;

  constructor(
    private mapService: MapService,
    private kyhService: KyhService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.kyhService.keyBoard.subscribe((res) => {
      this.moveByArrowkey(res);
    });

    this.placeHolder = this.kyhService.allPlaceHolder;

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

  async userFixedLocation() {
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

    let api_url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${userCoords.lng},${userCoords.lat}.json?types=locality&access_token=${environment.mapbox.accessToken}`;
    const response = await fetch(api_url);
    const data = await response.json();
    const userPlaceName = data.features[0].place_name;
    localStorage.setItem('userPlaceName', userPlaceName); //storing place name in localstorage
    this.router.navigate(['/know-your-hazards']);
    this.kyhService.setPlaceHolder(localStorage.getItem('userPlaceName'));
    this.searchTermCtrl.setValue(localStorage.getItem('userPlaceName'));
  }

  onEnterUser(event) {
    if (event.keyCode === ENTER) {
      this.router.navigate(['/know-your-hazards']);
      console.log('User Location Enter', event.keyCode);
      this.kyhService.setPlaceHolder(localStorage.getItem('userPlaceName'));
      this.searchTermCtrl.setValue(localStorage.getItem('userPlaceName'));
    }
  }

  pickPlace(place) {
    this.searchTermCtrl.setValue(place.text);
    this.isDropdownOpen = false;
    this.selectPlace.emit(place);
    this.kyhService.setPlaceHolder(place.text);
  }

  onKeyEnterPicked(place, event) {
    if (event.keyCode === ENTER) {
      this.searchTermCtrl.setValue(place.text);
      this.isDropdownOpen = false;
      this.selectPlace.emit(place);
      console.log('Picked Place Enter', event.keyCode);
      this.kyhService.setPlaceHolder(place.text);
    }
  }

  moveByArrowkey(object) {
    const inputToArray = this.inputs.toArray();
    let index = inputToArray.findIndex((x) => x.element == object.element);

    switch (object.action) {
      case 'UP':
        index -= this.column;
        console.log('UP');
        clearInterval(object);
        break;
      case 'DOWN':
        index += this.column;
        console.log('DOWN');
        clearInterval(object);
        break;
      case 'ENTER':
        index == this.column;
        clearInterval(object);
    }
    if (index >= 0 && index < this.inputs.length) {
      inputToArray[index].element.nativeElement.focus();
    }
  }
}
