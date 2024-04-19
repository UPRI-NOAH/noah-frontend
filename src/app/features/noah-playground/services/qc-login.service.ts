import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, Input } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { NoahPlaygroundService } from './noah-playground.service';
import { QcSensorService } from './qc-sensor.service';

@Injectable({
  providedIn: 'root',
})
export class QcLoginService {
  private QCBASE_URL = 'https://iot-noah.up.edu.ph';
  loginModal: boolean;
  isLoginModal: boolean = false;
  @Input() qcLoginModal: boolean;
  showAdminResult: boolean;
  adminStatus = '';
  adminName = '';

  private loginStatus = new BehaviorSubject<boolean>(this.checkLoginStatus());
  private disclaimerStatus = new BehaviorSubject<boolean>(
    this.checkDisclaimerStatus()
  );

  constructor(
    private http: HttpClient,
    private router: Router,
    private _location: Location,
    private pgService: NoahPlaygroundService,
    private qcSensorService: QcSensorService
  ) {}

  loginUser(username: string, password: string) {
    const loginData = {
      username: username,
      password: password,
    };

    return this.http.post<any>(`${this.QCBASE_URL}/login/`, loginData);
  }

  logout() {
    sessionStorage.removeItem('loggedIn');
    localStorage.removeItem('loginStatus');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('loginStatus');
    console.log('Logged out successfully');
    this.router
      .navigateByUrl('/logout', { skipLocationChange: true })
      .then(() => {
        this.router.navigate([decodeURI(this._location.path())]);
        window.location.reload();
      });
  }

  checkLoginStatus(): boolean {
    const loginCookie = localStorage.getItem('loginStatus');
    if (loginCookie == '1') {
      this.pgService.toggleQuezonCityIOTGroupShown();
      this.pgService.toggleQuezonCityIOTGroupExpanded();
      return true;
    }
    if (loginCookie == '2') {
      this.pgService.toggleQuezonCityIOTGroupShown();
      this.pgService.toggleQuezonCityIOTGroupExpanded();
      return true;
    }
    return false;
  }

  checkDisclaimerStatus(): boolean {
    const disclaimerCookie = localStorage.getItem('disclaimerStatus');
    if (disclaimerCookie == '1') {
      localStorage.setItem('disclaimerStatus', 'false');
      return true;
    } else {
      return false;
    }
  }

  get isLoggesIn() {
    return this.loginStatus.asObservable();
  }

  get isDisclaimerStatus() {
    return this.disclaimerStatus.asObservable();
  }

  showAdmin(): void {
    this.showAdminResult = true;
  }

  hideAdmin(): void {
    this.showAdminResult = false;
  }

  showLoginModal(): void {
    this.loginModal = true;
  }

  hideLoginModal(): void {
    this.loginModal = false;
  }
}
