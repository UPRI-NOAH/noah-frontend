import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';

export const user = localStorage.getItem('userLocation');
export const userCoords = JSON.parse(user);

export const PH_DEFAULT_CENTER = {
  lat: userCoords.lat,
  lng: userCoords.lng,
};

export type KYHPage = 'know-your-hazards' | 'critical-facilities' | HazardType;

export type HazardType = 'flood' | 'landslide' | 'storm-surge';

export type RiskLevel = 'unavailable' | 'little' | 'low' | 'medium' | 'high';

type KYHState = {
  isLoading: boolean;
  center: { lng: number; lat: number };
  currentCoords: { lng: number; lat: number };
  currentPage: KYHPage;
  currentHazard: HazardType;
  floodRiskLevel: RiskLevel;
  stormSurgeRiskLevel: RiskLevel;
  landslideRiskLevel: RiskLevel;
  currentLocation: string;
  allPlaceHolder: string;
};

const createInitialValue = (): KYHState => {
  return {
    isLoading: false,
    center: PH_DEFAULT_CENTER,
    currentCoords: PH_DEFAULT_CENTER,
    currentPage: 'know-your-hazards',
    currentHazard: 'flood',
    floodRiskLevel: 'unavailable',
    stormSurgeRiskLevel: 'unavailable',
    landslideRiskLevel: 'unavailable',
    currentLocation: '------',
    allPlaceHolder: '------',
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
