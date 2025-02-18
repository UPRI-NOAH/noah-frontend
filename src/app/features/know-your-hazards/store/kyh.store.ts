import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';

/**
 * UPRI OFFICE
 */
export const PH_DEFAULT_CENTER = {
  lat: 14.6577006,
  lng: 121.0709613,
};

export type HazardType = 'flood' | 'landslide' | 'storm-surge';

export type HazardExposureLevel = Record<HazardType, ExposureLevel>;

export type ExposureLevel =
  | 'unavailable'
  | 'little to none'
  | 'low'
  | 'medium'
  | 'high';

export type MapStyle = 'terrain' | 'satellite';

type KYHState = {
  isLoading: boolean;
  center: { lng: number; lat: number };
  currentCoords: { lng: number; lat: number };
  currentLocation: string;
  currentView: HazardType | 'all';
  exposureLevels: HazardExposureLevel;
};

const createInitialValue = (): KYHState => {
  return {
    isLoading: false,
    center: PH_DEFAULT_CENTER,
    currentCoords: PH_DEFAULT_CENTER,
    currentLocation: '',
    currentView: 'all',
    exposureLevels: {
      flood: 'unavailable',
      landslide: 'unavailable',
      'storm-surge': 'unavailable',
    },
  };
};

@Injectable({
  providedIn: 'root',
})
export class KyhStore extends StoreService<KYHState> {
  store = 'kyh-store';

  constructor() {
    super(createInitialValue());
  }
}
