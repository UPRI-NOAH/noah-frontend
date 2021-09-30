import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';

export const PH_DEFAULT_CENTER = {
  lat: 10.777080241395213,
  lng: 124.98707397619495,
};

export type KYHPage = 'know-your-hazards' | 'critical-facilities' | HazardType;

export type HazardType = 'flood' | 'landslide' | 'storm-surge';

// Remove later -- replace with exposure level
export type RiskLevel = 'unavailable' | 'little' | 'low' | 'medium' | 'high';
export type ExposureLevel =
  | 'unavailable'
  | 'little'
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
