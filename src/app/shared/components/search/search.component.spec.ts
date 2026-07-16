import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import {
  LocationSearchHistoryEntry,
  LocationSearchHistoryService,
} from '@core/services/location-search-history.service';
import { LocationService } from '@core/services/location.service';
import { MapService } from '@core/services/map.service';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let mapService: jasmine.SpyObj<MapService>;
  let locationService: jasmine.SpyObj<LocationService>;
  let gaService: jasmine.SpyObj<GoogleAnalyticsService>;
  let historySubject: BehaviorSubject<LocationSearchHistoryEntry[]>;
  let historyService: jasmine.SpyObj<LocationSearchHistoryService>;

  const historyEntry: LocationSearchHistoryEntry = {
    mapboxId: 'mapbox.manila',
    name: 'Manila',
    address: 'Manila, Philippines',
    coordinates: [120.9842, 14.5995],
    searchedAt: Date.now(),
  };

  beforeEach(async () => {
    historySubject = new BehaviorSubject<LocationSearchHistoryEntry[]>([]);
    mapService = jasmine.createSpyObj<MapService>(
      'MapService',
      ['forwardGeocode', 'retrievePlace', 'reverseGeocode'],
      { address$: new Subject<string>() }
    );
    locationService = jasmine.createSpyObj<LocationService>('LocationService', [
      'getCurrentLocation',
    ]);
    gaService = jasmine.createSpyObj<GoogleAnalyticsService>(
      'GoogleAnalyticsService',
      ['event']
    );
    historyService = jasmine.createSpyObj<LocationSearchHistoryService>(
      'LocationSearchHistoryService',
      ['refresh', 'record', 'remove', 'toSelectedPlace'],
      { history$: historySubject.asObservable() }
    );
    historyService.refresh.and.callFake(() => historySubject.value);
    historyService.toSelectedPlace.and.callFake((entry) => ({
      geometry: { type: 'Point', coordinates: entry.coordinates },
      properties: {
        mapbox_id: entry.mapboxId,
        name: entry.name,
        full_address: entry.address,
      },
    }));
    mapService.forwardGeocode.and.returnValue(of({ suggestions: [] }));

    await TestBed.configureTestingModule({
      declarations: [SearchComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: MapService, useValue: mapService },
        { provide: LocationService, useValue: locationService },
        { provide: GoogleAnalyticsService, useValue: gaService },
        { provide: LocationSearchHistoryService, useValue: historyService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows history only while the query is empty', () => {
    historySubject.next([historyEntry]);
    component.openDropdown();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="search-history-item"]'
      ).length
    ).toBe(1);

    component.searchTermCtrl.setValue('Manila');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="search-history-item"]'
      ).length
    ).toBe(0);
  });

  it('does not render a history section without valid entries', () => {
    component.openDropdown();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="search-history-item"]')
    ).toBeNull();
  });

  it('reopens history when the native search clear button empties the input', () => {
    historySubject.next([historyEntry]);
    component.searchTermCtrl.setValue('Manila');
    component.isDropdownOpen = false;
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[type="search"]'
    );

    input.value = '';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.isDropdownOpen).toBeTrue();
    expect(component.isSearchQueryEmpty).toBeTrue();
    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="search-history-item"]'
      ).length
    ).toBe(1);
  });

  it('records a successfully retrieved Mapbox result', () => {
    const suggestion = {
      mapbox_id: historyEntry.mapboxId,
      name: historyEntry.name,
      full_address: historyEntry.address,
    };
    const fullPlace = {
      geometry: { type: 'Point', coordinates: historyEntry.coordinates },
      properties: {
        mapbox_id: historyEntry.mapboxId,
        name: historyEntry.name,
        full_address: historyEntry.address,
      },
    };
    mapService.retrievePlace.and.returnValue(of({ features: [fullPlace] }));
    spyOn(component.selectPlace, 'emit');

    component.pickPlace(suggestion);

    expect(historyService.record).toHaveBeenCalledWith({
      mapboxId: historyEntry.mapboxId,
      name: historyEntry.name,
      address: historyEntry.address,
      coordinates: historyEntry.coordinates,
    });
    expect(component.selectPlace.emit).toHaveBeenCalledWith(fullPlace);
  });

  it('selects and promotes history without another Mapbox request', () => {
    const selectedPlace = historyService.toSelectedPlace(historyEntry);
    historyService.toSelectedPlace.calls.reset();
    spyOn(component.selectPlace, 'emit');

    component.pickHistoryEntry(historyEntry);

    expect(historyService.record).toHaveBeenCalledWith({
      mapboxId: historyEntry.mapboxId,
      name: historyEntry.name,
      address: historyEntry.address,
      coordinates: historyEntry.coordinates,
    });
    expect(mapService.retrievePlace).not.toHaveBeenCalled();
    expect(component.selectPlace.emit).toHaveBeenCalledWith(selectedPlace);
  });

  it('removes history without selecting it', () => {
    const event = jasmine.createSpyObj<Event>('Event', [
      'preventDefault',
      'stopPropagation',
    ]);
    spyOn(component.selectPlace, 'emit');

    component.removeHistoryEntry(event, historyEntry.mapboxId);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(historyService.remove).toHaveBeenCalledWith(historyEntry.mapboxId);
    expect(component.selectPlace.emit).not.toHaveBeenCalled();
  });

  it('cancels stale autocomplete results when the query is cleared', fakeAsync(() => {
    const response = new Subject<any>();
    mapService.forwardGeocode.and.returnValue(response);
    component.openDropdown();

    component.searchTermCtrl.setValue('Manila');
    tick(300);
    expect(mapService.forwardGeocode).toHaveBeenCalledWith('Manila');

    component.searchTermCtrl.setValue('');
    response.next({ suggestions: [{ name: 'Stale result' }] });

    expect(component.places$.value).toEqual([]);
    expect(historyService.refresh).toHaveBeenCalled();
  }));
});
