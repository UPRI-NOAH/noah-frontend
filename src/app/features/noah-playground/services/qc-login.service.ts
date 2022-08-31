import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NoahPlaygroundService } from './noah-playground.service';
import { QcSensorService } from './qc-sensor.service';

@Injectable({
  providedIn: 'root',
})
export class QcLoginService {
  private QCBASE_URL = 'https://noah-api.up.edu.ph';
  loginModal: boolean;
  isLoginModal: boolean = false;
  showAdminResult: boolean;

  private loginStatus = new BehaviorSubject<boolean>(this.checkLoginStatus());
  private disclaimerStatus = new BehaviorSubject<boolean>(
    this.checkDisclaimerStatus()
  );
  private UserName = new BehaviorSubject<string>(
    localStorage.getItem('username')
  );

  constructor(
    private http: HttpClient,
    private router: Router,
    private _location: Location,
    private pgService: NoahPlaygroundService,
    private qcSensorService: QcSensorService
  ) {}

  loginUser(username: string, password: string) {
    return this.http
      .post<any>(`${this.QCBASE_URL}/api/auth/token/login/`, {
        username,
        password,
      })
      .pipe(
        map((response) => {
          if (response && response.auth_token) {
            this.loginStatus.next(true);
            this.disclaimerStatus.next(true);
            localStorage.setItem('loginStatus', '1');
            localStorage.setItem('token', response.auth_token);
            localStorage.setItem('username', 'Qc Admin');
            this.qcSensorService.loadOnceDisclaimer$.subscribe((load) =>
              console.log(load)
            );
            this.UserName.next(localStorage.getItem('username'));
            console.log('username', username);
          }
          return response;
        })
      );
  }

  logout() {
    alert('Your Session expired');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.setItem('disclaimerStatus', 'false');
    localStorage.setItem('loginStatus', '0');
    console.log('Logged Out Successfully');
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

  get currentUserName() {
    return this.UserName.asObservable();
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
}
