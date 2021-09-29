import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MapService } from '@core/services/map.service';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { ENTER } from '@angular/cdk/keycodes';
import { LocationService } from '@core/services/location.service';

@Component({
  selector: 'noah-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  @Input() searchTerm: string;
  @Output() selectPlace: EventEmitter<any> = new EventEmitter();
  searchTermCtrl: FormControl;
  places$: BehaviorSubject<any[]>;

  isDropdownOpen = false;
  loading = false;

  focusedRowIdx: number = 0;

  @ViewChildren('locationOptions') locationOptions: QueryList<ElementRef>;

  constructor(
    private mapService: MapService,
    private locationService: LocationService
  ) {}

  ngOnInit(): void {
    this.searchTermCtrl = new FormControl(this.searchTerm);
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

  // TO DO: add type for place
  keydownAction(
    e: KeyboardEvent,
    eventType?: 'get-location' | 'select-option',
    place?: any
  ): void {
    try {
      const locationOptionsCount = this.locationOptions.length;
      const locationOptionsArray = this.locationOptions.toArray();
      switch (e.code) {
        case 'ArrowUp':
          this.focusedRowIdx -= 1;
          if (this.focusedRowIdx < 0 || this.focusedRowIdx - 1 < 0) {
            this.focusedRowIdx = locationOptionsCount - 1;
          }

          locationOptionsArray[this.focusedRowIdx].nativeElement.focus();
          e.preventDefault();
          break;
        case 'ArrowDown':
          this.focusedRowIdx = (this.focusedRowIdx + 1) % locationOptionsCount;
          locationOptionsArray[this.focusedRowIdx].nativeElement.focus();
          e.preventDefault();
          break;
        case 'Enter':
          this.focusedRowIdx = -1;

          if (eventType === 'get-location') {
            this.userFixedLocation();
          }

          if (eventType === 'select-option') {
            this.pickPlace(place);
          }

          return;
      }

      console.log(this.focusedRowIdx);
    } catch (error) {
      console.error({ error });
    }
  }

  async userFixedLocation() {
    if (this.loading) {
      return;
    }

    try {
      this.loading = true;
      const coords: { lat: number; lng: number } =
        await this.locationService.getCurrentLocation();

      const userPlaceName = await this.mapService.reverseGeocode(
        coords.lat,
        coords.lng
      );

      const selectedPlace = {
        text: userPlaceName,
        center: [coords.lng, coords.lat],
      };

      this.selectPlace.emit(selectedPlace);
      this.searchTermCtrl.setValue(userPlaceName);
    } catch (error) {
      console.error({ error });
      alert('Unable to find your location');
    } finally {
      this.loading = false;
      this.isDropdownOpen = false;
    }
  }

  pickPlace(place) {
    this.searchTermCtrl.setValue(place.text);
    this.isDropdownOpen = false;
    this.selectPlace.emit(place);
  }
}
