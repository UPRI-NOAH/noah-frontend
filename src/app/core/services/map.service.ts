import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import mapboxgl from 'mapbox-gl';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  constructor(private httpClient: HttpClient) {}

  init() {
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  getNewGeolocateControl() {
    return new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: false,
      },
      trackUserLocation: true,
    });
  }

  /**
   * Returns the geographic coordinates given a string address
   */
  forwardGeocode() {}

  /**
   * Returns the string address given the geographic coordinates
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const api_url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lat},${lng}.json?types=locality&access_token=${environment.mapbox.accessToken}`;
      const response = await this.httpClient.get<any>(api_url).toPromise();
      return response.features[0].place_name;
    } catch (error) {
      console.error(error);
      throw Error('Unable to perform reverse geocoding');
    }
  }
}
