import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QcLoginService {
  private QCBASE_URL = 'https://noah-api.up.edu.ph';
  loginModal: boolean;
  qcadmin = 'QC Admin';
  isLoginModal: boolean = false;
  showAdminResult: boolean;

  constructor(private http: HttpClient) {}

  loginUser(userData): Observable<any> {
    return this.http.post(`${this.QCBASE_URL}/api/auth/token/login/`, userData);
  }

  showAdmin(): void {
    this.showAdminResult = true;
    console.log('SHOW');
  }

  hideAdmin(): void {
    this.showAdminResult = false;
    console.log('HIDE');
  }

  showLoginModal(): void {
    this.loginModal = true;
    console.log('SHOW MODAL');
  }

  hideLoginModal(): void {
    this.loginModal = false;
    console.log('HIDE MODAL');
  }

  getQuezonCityLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject();
      }

      function locationSuccess() {
        // const latitude = position.coords.latitude;
        // const longitude = position.coords.longitude;
        const coords = { lng: 121.04925, lat: 14.65146 };
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
