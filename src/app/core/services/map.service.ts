import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import mapboxgl from 'mapbox-gl';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  constructor() {}

  init() {
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  /**
   * Returns the geographic coordinates given a string address
   */
  forwardGeocode() {}

  /**
   * Returns the string address given the geographic coordinates
   */
  async reverseGeocode(lat: number, lng: number) {
    let api_url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=locality&access_token=${environment.mapbox.accessToken}`;
    const response = await fetch(api_url);
    const data = await response.json();
    // TO DO: handle error or empty features
    const myPlace = data.features[0].place_name; // not safe -- assumes that features array always has a first element
    return myPlace;
  }
}
