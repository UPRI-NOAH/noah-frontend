import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';

/**
 * PH Center
 */
export const PH_DEFAULT_CENTER = {
  lat: 12.51,
  lng: 121.59,
};

export const UPRI_DEFAULT_CENTER = {
  lat: 14.6577006,
  lng: 121.0709613,
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

export const TEMPERATURE_FORECAST_DAYS = [
  { label: 'Latest', value: 1 },
  { label: '+1D', value: 2 },
  { label: '+2D', value: 3 },
  { label: '+3D', value: 4 },
  { label: '+4D', value: 5 },
] as const;

export const TEMPERATURE = ['heat_index', 'max_temperature'] as const;

export type TemperatureType = typeof TEMPERATURE[number];

export type TemperatureForecastDay =
  typeof TEMPERATURE_FORECAST_DAYS[number]['value'];

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

export type TemperatureState = {
  shown: boolean;
  expanded: boolean;
  selectedType: TemperatureType;
  selectedForecastDay: TemperatureForecastDay;
  types: TemperatureTypesState;
};

export type TemperatureTypesState = {
  heat_index: TemperatureTypeState;
  max_temperature: TemperatureTypeState;
};

export type TemperatureTypeState = {
  opacity: number;
  fetched: boolean;
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
  center: { lng: number; lat: number } | null;
  currentCoords: { lng: number; lat: number };
  currentLocation: string;
  overlayOpacity: number;
  rainfallContourTypes: RainfallContourState;
  typhoonTrack: TyphoonTrackState;
  weatherSatellite: WeatherSatelliteState;
  temperature: TemperatureState;
};

const createInitialValue = (): WeatherUpdatesState => {
  return {
    isLoading: false,
    center: null,
    currentCoords: PH_DEFAULT_CENTER,
    currentLocation: '',
    overlayOpacity: 80,
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
    temperature: {
      shown: false,
      expanded: false,
      selectedType: 'heat_index',
      selectedForecastDay: 1,
      types: {
        heat_index: {
          opacity: 80,
          fetched: false,
        },
        max_temperature: {
          opacity: 80,
          fetched: false,
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
