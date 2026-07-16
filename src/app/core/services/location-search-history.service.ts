import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export const LOCATION_SEARCH_HISTORY_STORAGE_KEY =
  'noah.locationSearchHistory.v1';
export const LOCATION_SEARCH_HISTORY_MAX_ITEMS = 5;
export const LOCATION_SEARCH_HISTORY_TTL_MS = 5 * 24 * 60 * 60 * 1000;

export interface LocationSearchHistoryEntry {
  mapboxId: string;
  name: string;
  address: string;
  coordinates: [number, number];
  searchedAt: number;
}

export type NewLocationSearchHistoryEntry = Omit<
  LocationSearchHistoryEntry,
  'searchedAt'
>;

export interface LocationSearchHistorySelection {
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    mapbox_id: string;
    name: string;
    full_address: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class LocationSearchHistoryService {
  private readonly historySubject = new BehaviorSubject<
    LocationSearchHistoryEntry[]
  >([]);

  readonly history$: Observable<LocationSearchHistoryEntry[]> =
    this.historySubject.asObservable();

  constructor() {
    this.refresh();
  }

  refresh(): LocationSearchHistoryEntry[] {
    const history = this.readValidHistory();
    this.publishAndPersist(history);
    return history;
  }

  record(entry: NewLocationSearchHistoryEntry): void {
    if (!this.isValidNewEntry(entry)) {
      return;
    }

    const history = this.readValidHistory().filter(
      (historyEntry) => historyEntry.mapboxId !== entry.mapboxId
    );
    const updatedHistory = [
      { ...entry, searchedAt: Date.now() },
      ...history,
    ].slice(0, LOCATION_SEARCH_HISTORY_MAX_ITEMS);

    this.publishAndPersist(updatedHistory);
  }

  remove(mapboxId: string): void {
    const history = this.readValidHistory().filter(
      (entry) => entry.mapboxId !== mapboxId
    );
    this.publishAndPersist(history);
  }

  toSelectedPlace(
    entry: LocationSearchHistoryEntry
  ): LocationSearchHistorySelection {
    return {
      geometry: {
        type: 'Point',
        coordinates: entry.coordinates,
      },
      properties: {
        mapbox_id: entry.mapboxId,
        name: entry.name,
        full_address: entry.address,
      },
    };
  }

  private readValidHistory(): LocationSearchHistoryEntry[] {
    try {
      const storedHistory = localStorage.getItem(
        LOCATION_SEARCH_HISTORY_STORAGE_KEY
      );
      if (!storedHistory) {
        return [];
      }

      const parsedHistory: unknown = JSON.parse(storedHistory);
      if (!Array.isArray(parsedHistory)) {
        return [];
      }

      const now = Date.now();
      const seenMapboxIds = new Set<string>();

      return parsedHistory
        .filter((entry): entry is LocationSearchHistoryEntry =>
          this.isValidStoredEntry(entry)
        )
        .filter(
          (entry) =>
            entry.searchedAt <= now &&
            now - entry.searchedAt <= LOCATION_SEARCH_HISTORY_TTL_MS
        )
        .sort((left, right) => right.searchedAt - left.searchedAt)
        .filter((entry) => {
          if (seenMapboxIds.has(entry.mapboxId)) {
            return false;
          }
          seenMapboxIds.add(entry.mapboxId);
          return true;
        })
        .slice(0, LOCATION_SEARCH_HISTORY_MAX_ITEMS);
    } catch (error) {
      return [];
    }
  }

  private publishAndPersist(history: LocationSearchHistoryEntry[]): void {
    this.historySubject.next(history);

    try {
      localStorage.setItem(
        LOCATION_SEARCH_HISTORY_STORAGE_KEY,
        JSON.stringify(history)
      );
    } catch (error) {
      // Location search should continue to work when browser storage is blocked.
    }
  }

  private isValidNewEntry(
    entry: NewLocationSearchHistoryEntry
  ): entry is NewLocationSearchHistoryEntry {
    return (
      this.isNonEmptyString(entry?.mapboxId) &&
      this.isNonEmptyString(entry?.name) &&
      typeof entry?.address === 'string' &&
      this.isValidCoordinates(entry?.coordinates)
    );
  }

  private isValidStoredEntry(
    entry: unknown
  ): entry is LocationSearchHistoryEntry {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    const candidate = entry as LocationSearchHistoryEntry;
    return (
      this.isValidNewEntry(candidate) &&
      Number.isFinite(candidate.searchedAt) &&
      candidate.searchedAt > 0
    );
  }

  private isValidCoordinates(
    coordinates: unknown
  ): coordinates is [number, number] {
    return (
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      coordinates.every((coordinate) => Number.isFinite(coordinate)) &&
      coordinates[0] >= -180 &&
      coordinates[0] <= 180 &&
      coordinates[1] >= -90 &&
      coordinates[1] <= 90
    );
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
