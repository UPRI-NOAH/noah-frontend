import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';

const PH_DEFAULT_CENTER = { lat: 10.777080241395213, lng: 124.98707397619495 };

export type PRAPage = 'base' | 'critical-facilities' | HazardType;

export type HazardType = 'flood' | 'landslide' | 'storm-surge';

export type RiskLevel = 'unavailable' | 'little' | 'low' | 'medium' | 'high';

type PRAState = {
  isLoading: boolean;
  center: { lng: number; lat: number };
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
