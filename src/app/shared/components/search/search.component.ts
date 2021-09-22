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
import { MapService } from '@core/services/map.service';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { ArrowKeysDirective } from '@shared/arrow-keys.directive';
import { ENTER } from '@angular/cdk/keycodes';

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

  row: number = 1;
  @ViewChildren(ArrowKeysDirective) inputs: QueryList<ArrowKeysDirective>;

  constructor(private mapService: MapService, private kyhService: KyhService) {}

  ngOnInit(): void {
    this.kyhService.keyBoard.subscribe((res) => {
      this.moveByArrowkey(res);
    });
    this.kyhService.init();
    this.searchTermCtrl = new FormControl(this.searchTerm);
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

  async userFixedLocation(event) {
    // HERE GETTING USER COORDINATES THEN PARSE TO LOCAL STORAGE
    function locationSuccess(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const coords = { lng: longitude, lat: latitude };
      localStorage.setItem('userLocation', JSON.stringify(coords));
    }

    function locationError(error) {
      const message = error.message;
      alert(message);
    }
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
    //GETTING COORDINATES TO LOCAL STORAGE
    const user = localStorage.getItem('userLocation');
    const userCoords = JSON.parse(user);

    const userPlaceName = await this.mapService.reverseGeocode(
      userCoords.lat,
      userCoords.lng
    );
    localStorage.setItem('userPlaceName', userPlaceName); //storing place name in localstorage
    const selectedPlace = {
      text: userPlaceName,
      center: [userCoords.lng, userCoords.lat],
    };
    this.selectPlace.emit(selectedPlace);
    this.searchTermCtrl.setValue(userPlaceName);
    this.kyhService.setCenter(userCoords); // user location center when in kyh page
  }

  onEnterUser(event) {
    if (event.keyCode === ENTER) {
      const user = localStorage.getItem('userLocation');
      const userCoords = JSON.parse(user);
      const selectedPlace = {
        text: localStorage.getItem('userPlaceName'),
        center: [userCoords.lng, userCoords.lat],
      };
      this.kyhService.setCenter(userCoords); // user location center when in kyh page
      this.selectPlace.emit(selectedPlace);
      this.searchTermCtrl.setValue(localStorage.getItem('userPlaceName'));
    }
  }

  pickPlace(place) {
    this.searchTermCtrl.setValue(place.text);
    this.isDropdownOpen = false;
    this.selectPlace.emit(place);
  }

  onKeyEnterPickedPlace(place, event) {
    if (event.keyCode === ENTER) {
      this.isDropdownOpen = false;
      this.selectPlace.emit(place);
      this.searchTermCtrl.setValue(place.text);
    }
  }

  moveByArrowkey(object) {
    const inputToArray = this.inputs.toArray();
    let index = inputToArray.findIndex((x) => x.element == object.element);

    switch (object.action) {
      case 'UP':
        index -= this.row;
        clearInterval(object);
        break;
      case 'DOWN':
        index += this.row;
        clearInterval(object);
        break;
      case 'ENTER':
        index == this.row;
        clearInterval(object);
    }
    if (index >= 0 && index < this.inputs.length) {
      inputToArray[index].element.nativeElement.focus();
    }
  }
}
