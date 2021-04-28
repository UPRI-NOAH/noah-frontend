import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';
import { LngLatLike } from 'mapbox-gl';

const PH_DEFAULT_CENTER = { lat: 10.783643615788, lng: 124.98624449022346 };

export type PRAPage = 'base' | 'critical-facitilies' | HazardType;

export type HazardType = 'flood' | 'landslide' | 'storm-surge';

export type RiskLevel = 'unavailable' | 'little' | 'low' | 'medium' | 'high';

type PRAState = {
  isLoading: boolean;
  center: LngLatLike;
  currentPage: PRAPage;
  riskLevel: RiskLevel;
};

const createInitialValue = (): PRAState => {
  return {
    isLoading: false,
    center: PH_DEFAULT_CENTER,
    currentPage: 'base',
    riskLevel: 'unavailable',
  };
};

@Injectable({
  providedIn: 'root',
})
export class PraStore extends StoreService<PRAState> {
  store = 'pra-store';

  constructor() {
    super(createInitialValue());
  }
}
