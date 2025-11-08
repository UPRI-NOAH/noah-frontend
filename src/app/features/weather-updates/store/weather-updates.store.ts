import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';

/**
 * PH Center
 */
export const PH_DEFAULT_CENTER = {
  lat: 12.51,
  lng: 121.59,
};

export const RainfallContourType = [
  '1hr',
  '3hr',
  '6hr',
  '12hr',
  '24hr',
  'forecast',
] as const;

export type MapStyle = 'terrain' | 'satellite';

export type RainfallContourTypes = typeof RainfallContourType[number];

export type RainfallContourState = {
  shown: boolean;
  selectedType: RainfallContourTypes;
  fade: { [key in RainfallContourTypes]: { opacity: number } };
};

export type RainfallContourTypeState = {
  opacity: number;
};

export type TyphoonTrackState = {
  shown: boolean;
  expanded: boolean;
};

export const WEATHER_SATELLITE_ARR = ['himawari'] as const;

export type WeatherSatelliteType = typeof WEATHER_SATELLITE_ARR[number];

export type WeatherSatelliteState = {
  shown: boolean;
  expanded: boolean;
  selectedType: WeatherSatelliteType;
  types: WeatherSatelliteTypesState;
};

export type WeatherSatelliteTypeState = {
  opacity: number;
};

export type WeatherSatelliteTypesState = {
  himawari: WeatherSatelliteTypeState;
};

type WeatherUpdatesState = {
  isLoading: boolean;
  center: { lng: number; lat: number };
  currentCoords: { lng: number; lat: number };
  currentLocation: string;
  rainfallContourTypes: RainfallContourState;
  typhoonTrack: TyphoonTrackState;
  weatherSatellite: WeatherSatelliteState;
};

const createInitialValue = (): WeatherUpdatesState => {
  return {
    isLoading: false,
    center: null,
    currentCoords: PH_DEFAULT_CENTER,
    currentLocation: '',
    rainfallContourTypes: {
      shown: true,
      selectedType: '1hr',
      fade: {
        '1hr': { opacity: 100 },
        '3hr': { opacity: 100 },
        '6hr': { opacity: 100 },
        '12hr': { opacity: 100 },
        '24hr': { opacity: 100 },
        forecast: { opacity: 100 },
      },
    },
    typhoonTrack: {
      shown: false,
      expanded: false,
    },
    weatherSatellite: {
      shown: false,
      expanded: false,
      selectedType: 'himawari',
      types: {
        himawari: {
          opacity: 60,
        },
      },
    },
  };
};

@Injectable({
  providedIn: 'root',
})
export class WeatherUpdatesStore extends StoreService<WeatherUpdatesState> {
  store = 'weather-updates-store';

  constructor() {
    super(createInitialValue());
  }
}
