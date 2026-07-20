import {
  LOCATION_SEARCH_HISTORY_MAX_ITEMS,
  LOCATION_SEARCH_HISTORY_STORAGE_KEY,
  LOCATION_SEARCH_HISTORY_TTL_MS,
  LocationSearchHistoryEntry,
  LocationSearchHistoryService,
  NewLocationSearchHistoryEntry,
} from './location-search-history.service';

describe('LocationSearchHistoryService', () => {
  const now = new Date('2026-07-14T12:00:00.000Z');
  let service: LocationSearchHistoryService;
  let latestHistory: LocationSearchHistoryEntry[];

  const createEntry = (
    index: number,
    searchedAt = now.getTime() - index
  ): LocationSearchHistoryEntry => ({
    mapboxId: `mapbox-${index}`,
    name: `Location ${index}`,
    address: `Address ${index}`,
    coordinates: [120 + index, 14 + index],
    searchedAt,
  });

  const createNewEntry = (index: number): NewLocationSearchHistoryEntry => {
    const { searchedAt, ...entry } = createEntry(index);
    return entry;
  };

  beforeEach(() => {
    localStorage.removeItem(LOCATION_SEARCH_HISTORY_STORAGE_KEY);
    jasmine.clock().install();
    jasmine.clock().mockDate(now);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    localStorage.removeItem(LOCATION_SEARCH_HISTORY_STORAGE_KEY);
  });

  function createService(): void {
    service = new LocationSearchHistoryService();
    service.history$.subscribe((history) => (latestHistory = history));
  }

  it('returns an empty history for missing or malformed storage', () => {
    localStorage.setItem(LOCATION_SEARCH_HISTORY_STORAGE_KEY, '{malformed');

    createService();

    expect(latestHistory).toEqual([]);
    expect(localStorage.getItem(LOCATION_SEARCH_HISTORY_STORAGE_KEY)).toBe(
      '[]'
    );
  });

  it('filters invalid records and entries older than five days', () => {
    const exactlyFiveDaysOld = createEntry(
      1,
      now.getTime() - LOCATION_SEARCH_HISTORY_TTL_MS
    );
    const expired = createEntry(
      2,
      now.getTime() - LOCATION_SEARCH_HISTORY_TTL_MS - 1
    );
    const futureDated = createEntry(3, now.getTime() + 1);
    localStorage.setItem(
      LOCATION_SEARCH_HISTORY_STORAGE_KEY,
      JSON.stringify([
        expired,
        futureDated,
        { name: 'Missing required fields' },
        exactlyFiveDaysOld,
      ])
    );

    createService();

    expect(latestHistory).toEqual([exactlyFiveDaysOld]);
  });

  it('stores no more than five entries in most-recent-first order', () => {
    createService();

    for (
      let index = 0;
      index < LOCATION_SEARCH_HISTORY_MAX_ITEMS + 2;
      index++
    ) {
      jasmine.clock().tick(1);
      service.record(createNewEntry(index));
    }

    expect(latestHistory.length).toBe(LOCATION_SEARCH_HISTORY_MAX_ITEMS);
    expect(latestHistory.map((entry) => entry.mapboxId)).toEqual([
      'mapbox-6',
      'mapbox-5',
      'mapbox-4',
      'mapbox-3',
      'mapbox-2',
    ]);
  });

  it('moves a duplicate Mapbox location to the top without duplicating it', () => {
    localStorage.setItem(
      LOCATION_SEARCH_HISTORY_STORAGE_KEY,
      JSON.stringify([createEntry(1), createEntry(2)])
    );
    createService();

    jasmine.clock().tick(10);
    service.record(createNewEntry(2));

    expect(latestHistory.map((entry) => entry.mapboxId)).toEqual([
      'mapbox-2',
      'mapbox-1',
    ]);
    expect(latestHistory[0].searchedAt).toBe(now.getTime() + 10);
  });

  it('removes one persisted entry and updates subscribers', () => {
    localStorage.setItem(
      LOCATION_SEARCH_HISTORY_STORAGE_KEY,
      JSON.stringify([createEntry(1), createEntry(2)])
    );
    createService();

    service.remove('mapbox-1');

    expect(latestHistory.map((entry) => entry.mapboxId)).toEqual(['mapbox-2']);
    expect(
      JSON.parse(localStorage.getItem(LOCATION_SEARCH_HISTORY_STORAGE_KEY))
    ).toEqual(latestHistory);
  });

  it('continues publishing history when localStorage writes are blocked', () => {
    createService();
    spyOn(localStorage, 'setItem').and.throwError('Storage blocked');

    expect(() => service.record(createNewEntry(1))).not.toThrow();
    expect(latestHistory.map((entry) => entry.mapboxId)).toEqual(['mapbox-1']);
  });

  it('reconstructs the location payload expected by search consumers', () => {
    createService();
    const entry = createEntry(1);

    expect(service.toSelectedPlace(entry)).toEqual({
      geometry: {
        type: 'Point',
        coordinates: entry.coordinates,
      },
      properties: {
        mapbox_id: entry.mapboxId,
        name: entry.name,
        full_address: entry.address,
      },
    });
  });
});
