import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject();
      }

      function locationSuccess(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const coords = { lng: longitude, lat: latitude };
        resolve(coords);
      }

      function locationError(error) {
        reject(error);
      }

      const options = {
        enableHighAccuracy: true,
      };

      navigator.geolocation.getCurrentPosition(
        locationSuccess,
        locationError,
        options
      );
    });
  }
}
