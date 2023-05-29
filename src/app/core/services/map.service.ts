import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import mapboxgl from 'mapbox-gl';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  constructor(private httpClient: HttpClient) {}
  private addressSubject = new Subject<string>();
  address$: Observable<string> = this.addressSubject.asObservable();

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

  getNewAttributionControl() {
    return new mapboxgl.AttributionControl({
      customAttribution:
        '<a href="https://doh.gov.ph" target="_blank">© Department of Health</a>',
    });
  }

  /**
   * Returns the geographic coordinates given a string address
   */
  forwardGeocode(searchText: string) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchText}.json?country=PH&access_token=${environment.mapbox.accessToken}`;
    return this.httpClient.get(url);
  }

  /**
   * Returns the string address given the geographic coordinates
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const api_url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=locality&access_token=${environment.mapbox.accessToken}`;
      const response = await this.httpClient.get<any>(api_url).toPromise();
      return response.features[0].place_name;
    } catch (error) {
      console.error(error);
      throw Error('Unable to perform reverse geocoding');
    }
  }

  /**
   * Returns the string address given the geographic coordinates this is applicable for drag marker
   */
  async dragReverseGeocode(lat: number, lng: number) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${environment.mapbox.accessToken}`;
      const response = await fetch(url);
      const data = await response.json();
      const address = data.features[0].place_name;
      this.addressSubject.next(address);
      return address;
    } catch (error) {
      console.error(error);
      throw new Error('Unable to perform drag reverse geocoding');
    }
  }
}
