import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import mapboxgl from 'mapbox-gl';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  constructor() {
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }
}
