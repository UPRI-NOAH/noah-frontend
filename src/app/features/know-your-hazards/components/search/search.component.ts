import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MapService } from '@core/services/map.service';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';

type FixedLeyte = {
  center: [number, number];
  text: string;
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

  get fixedForLeyte(): FixedLeyte {
    return {
      center: [124.98707397619495, 10.777080241395213],
      text: 'Leyte',
      place_name: 'Leyte, Philippines',
    };
  }

  pickPlace(place) {
    this.searchTermCtrl.setValue(place.text);
    this.isDropdownOpen = false;
    this.selectPlace.emit(place);

    this.kyhService.setCurrentLocation(place.text);
    const [lng, lat] = place.center;
    this.kyhService.setCenter({ lat, lng });
    this.kyhService.setCurrentCoords({ lat, lng });
  }
}
