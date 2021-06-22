import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { FeatureCollection } from 'geojson';

@Injectable({
  providedIn: 'root',
})
export class CriticalFacilitiesService {
  constructor(private http: HttpClient) {}

  // getCriticalFacilities() {
  //   const baseURL = `https://api.mapbox.com/v4/${payload.TileSet}/tilequery/${lng},${lat}.json`
  //   const params = new HttpParams()
  //     .set('radius', payload.radius ? String(payload.radius) : '50')
  //     .set('limit', payload.limit ? String(payload.limit) : '20')
  //     .set('access_token', environment.mapbox.accessToken);

  //   return this.http.get<FeatureCollection>
  // }
}
