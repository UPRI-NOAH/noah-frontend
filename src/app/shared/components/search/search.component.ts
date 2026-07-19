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
import {
  LocationSearchHistoryEntry,
  LocationSearchHistoryService,
  NewLocationSearchHistoryEntry,
} from '@core/services/location-search-history.service';
import { MapService } from '@core/services/map.service';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  finalize,
  map,
  switchMap,
} from 'rxjs/operators';

import { LocationService } from '@core/services/location.service';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

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
  history$: Observable<LocationSearchHistoryEntry[]>;

  isDropdownOpen = false;
  loading = false;
  address: string;
  focusedRowIdx: number = -1;

  @ViewChildren('locationOptions') locationOptions: QueryList<ElementRef>;

  constructor(
    private gaService: GoogleAnalyticsService,
    private mapService: MapService,
    private locationService: LocationService,
    private locationSearchHistoryService: LocationSearchHistoryService
  ) {}

  ngOnInit(): void {
    this.searchTermCtrl = new FormControl(this.searchTerm);
    this.places$ = new BehaviorSubject([]);
    this.history$ = this.locationSearchHistoryService.history$;

    this.searchTermCtrl.valueChanges
      .pipe(
        map((searchText) => this.normalizeSearchText(searchText)),
        distinctUntilChanged(),
        switchMap((searchText) => {
          if (!searchText) {
            this.loading = false;
            this.places$.next([]);
            this.locationSearchHistoryService.refresh();
            return of([]);
          }

          this.places$.next([]);
          return timer(300).pipe(
            switchMap(() => {
              if (!this.isDropdownOpen) {
                return of([]);
              }

              this.loading = true;
              return this.mapService.forwardGeocode(searchText).pipe(
                map((value: any) => value?.suggestions || []),
                catchError((error) => {
                  console.error({ error });
                  return of([]);
                }),
                finalize(() => (this.loading = false))
              );
            })
          );
        })
      )
      .subscribe((places: any[]) => {
        this.places$.next(places);
      });

    this.mapService.address$.subscribe((address) => {
      this.address = address; // Update address in real-time
      this.searchTermCtrl.setValue(address);
    });
  }

  get isSearchQueryEmpty(): boolean {
    return !this.normalizeSearchText(this.searchTermCtrl?.value);
  }

  openDropdown(): void {
    this.isDropdownOpen = true;
    this.focusedRowIdx = -1;

    if (this.isSearchQueryEmpty) {
      this.locationSearchHistoryService.refresh();
    }
  }

  // TO DO: add type for place
  keydownAction(
    e: KeyboardEvent,
    eventType?: 'get-location' | 'select-option' | 'select-history',
    place?: any
  ): void {
    try {
      const locationOptionsCount = this.locationOptions.length;
      const locationOptionsArray = this.locationOptions.toArray();

      if (!locationOptionsCount) {
        return;
      }

      switch (e.code) {
        case 'ArrowUp':
          this.focusedRowIdx =
            this.focusedRowIdx <= 0
              ? locationOptionsCount - 1
              : this.focusedRowIdx - 1;

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

          if (eventType === 'select-history') {
            this.pickHistoryEntry(place);
          }

          return;
      }
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

      this.gaService.event('select_location', 'geolocation');
      this.searchTermCtrl.setValue(userPlaceName);
      this.selectPlace.emit(selectedPlace);
    } catch (error) {
      console.error({ error });
      alert('Unable to find your location');
    } finally {
      this.loading = false;
      this.isDropdownOpen = false;
    }
  }

  pickPlace(place: any) {
    this.gaService.event('select_location', 'dropdown_option');

    this.isDropdownOpen = false;
    this.searchTermCtrl.setValue(place.name || place.text || place.place_name);

    this.mapService.retrievePlace(place.mapbox_id).subscribe((result: any) => {
      // check both possible response shapes
      const fullPlace = result?.features?.[0] || result?.feature || null;

      if (fullPlace) {
        const historyEntry = this.createHistoryEntry(place, fullPlace);
        if (historyEntry) {
          this.locationSearchHistoryService.record(historyEntry);
        }
        this.selectPlace.emit(fullPlace);
      } else {
        console.warn(
          'No features returned from retrieve, falling back:',
          place
        );
        this.selectPlace.emit(place);
      }
    });
  }

  pickHistoryEntry(entry: LocationSearchHistoryEntry): void {
    this.gaService.event('select_location', 'search_history');
    this.isDropdownOpen = false;
    this.searchTermCtrl.setValue(entry.name);
    this.locationSearchHistoryService.record({
      mapboxId: entry.mapboxId,
      name: entry.name,
      address: entry.address,
      coordinates: entry.coordinates,
    });
    this.selectPlace.emit(
      this.locationSearchHistoryService.toSelectedPlace(entry)
    );
  }

  removeHistoryEntry(event: Event, mapboxId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.locationSearchHistoryService.remove(mapboxId);
  }

  private createHistoryEntry(
    suggestion: any,
    fullPlace: any
  ): NewLocationSearchHistoryEntry | null {
    const coordinates = fullPlace?.center || fullPlace?.geometry?.coordinates;
    const mapboxId =
      fullPlace?.properties?.mapbox_id ||
      fullPlace?.mapbox_id ||
      suggestion?.mapbox_id;
    const name =
      fullPlace?.properties?.name ||
      fullPlace?.text ||
      fullPlace?.place_name ||
      suggestion?.name ||
      suggestion?.text;
    const address =
      fullPlace?.properties?.full_address ||
      fullPlace?.properties?.place_formatted ||
      fullPlace?.place_name ||
      suggestion?.full_address ||
      suggestion?.place_formatted ||
      suggestion?.place_name ||
      '';

    if (
      !mapboxId ||
      !name ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2
    ) {
      return null;
    }

    return {
      mapboxId,
      name,
      address,
      coordinates: [coordinates[0], coordinates[1]],
    };
  }

  private normalizeSearchText(searchText: unknown): string {
    return typeof searchText === 'string' ? searchText.trim() : '';
  }
}
