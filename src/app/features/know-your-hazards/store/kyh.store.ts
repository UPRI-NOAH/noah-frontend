import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';

/**
 * Malacañang palace
 */
export const PH_DEFAULT_CENTER = {
  lat: 14.594112104824488,
  lng: 120.9943811923392,
};

export type KYHPage = 'know-your-hazards' | 'critical-facilities' | HazardType;

export type HazardType = 'flood' | 'landslide' | 'storm-surge';

// Remove later -- replace with exposure level
export type RiskLevel =
  | 'unavailable'
  | 'little to none'
  | 'low'
  | 'medium'
  | 'high';
export type ExposureLevel =
  | 'unavailable'
  | 'little to none'
  | 'low'
  | 'medium'
  | 'high';

export type HazardState = {
  shown: boolean;
};

type KYHState = {
  isLoading: boolean;
  center: { lng: number; lat: number };
  currentCoords: { lng: number; lat: number };
  currentPage: KYHPage;
  floodRiskLevel: RiskLevel;
  stormSurgeRiskLevel: RiskLevel;
  landslideRiskLevel: RiskLevel;
  currentLocation: string;

  flood: HazardState;
  landslide: HazardState;
  'storm-surge': HazardState;
};

const createInitialValue = (): KYHState => {
  return {
    isLoading: false,
    center: PH_DEFAULT_CENTER,
    currentCoords: PH_DEFAULT_CENTER,
    currentPage: 'know-your-hazards',
    floodRiskLevel: 'unavailable',
    stormSurgeRiskLevel: 'unavailable',
    landslideRiskLevel: 'unavailable',
    currentLocation: '',

    flood: {
      shown: true,
    },
    landslide: {
      shown: true,
    },
    'storm-surge': {
      shown: true,
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
