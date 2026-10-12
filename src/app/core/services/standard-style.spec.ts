import {
  getBasemapForPhilippineHour,
  getBasemapForPhilippineTime,
  getPhilippineHour,
} from './standard-style';

describe('Philippine-Time basemap schedule', () => {
  describe('getPhilippineHour', () => {
    it('resolves the hour in Asia/Manila regardless of the UTC instant', () => {
      // 2026-01-01T00:00:00Z is 08:00 in the Philippines (UTC+8).
      expect(getPhilippineHour(new Date('2026-01-01T00:00:00Z'))).toBe(8);
      // 2026-01-01T16:00:00Z is midnight in the Philippines.
      expect(getPhilippineHour(new Date('2026-01-01T16:00:00Z'))).toBe(0);
      // 2026-01-01T15:59:00Z is 23:59 in the Philippines.
      expect(getPhilippineHour(new Date('2026-01-01T15:59:00Z'))).toBe(23);
    });
  });

  describe('getBasemapForPhilippineHour', () => {
    it('maps each window edge to the matching preset', () => {
      expect(getBasemapForPhilippineHour(4)).toBe('night');
      expect(getBasemapForPhilippineHour(5)).toBe('dawn');
      expect(getBasemapForPhilippineHour(7)).toBe('dawn');
      expect(getBasemapForPhilippineHour(8)).toBe('day');
      expect(getBasemapForPhilippineHour(16)).toBe('day');
      expect(getBasemapForPhilippineHour(17)).toBe('dusk');
      expect(getBasemapForPhilippineHour(18)).toBe('dusk');
      expect(getBasemapForPhilippineHour(19)).toBe('night');
      expect(getBasemapForPhilippineHour(23)).toBe('night');
      expect(getBasemapForPhilippineHour(0)).toBe('night');
    });

    it('normalises out-of-range hours into a single day', () => {
      expect(getBasemapForPhilippineHour(24)).toBe('night');
      expect(getBasemapForPhilippineHour(-1)).toBe('night');
      expect(getBasemapForPhilippineHour(32)).toBe('day');
    });
  });

  describe('getBasemapForPhilippineTime', () => {
    it('derives the preset from the Philippine clock', () => {
      // 06:00 PHT → dawn.
      expect(
        getBasemapForPhilippineTime(new Date('2025-06-01T22:00:00Z'))
      ).toBe('dawn');
      // 12:00 PHT → day.
      expect(
        getBasemapForPhilippineTime(new Date('2025-06-01T04:00:00Z'))
      ).toBe('day');
      // 18:00 PHT → dusk.
      expect(
        getBasemapForPhilippineTime(new Date('2025-06-01T10:00:00Z'))
      ).toBe('dusk');
      // 22:00 PHT → night.
      expect(
        getBasemapForPhilippineTime(new Date('2025-06-01T14:00:00Z'))
      ).toBe('night');
    });
  });
});
