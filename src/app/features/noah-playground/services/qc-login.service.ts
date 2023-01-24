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
  private QCBASE_URL = 'https://noah-api.up.edu.ph';
  loginModal: boolean;
  isLoginModal: boolean = false;
  @Input() qcLoginModal: boolean;
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
          }
          return response;
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('loginStatus');
    localStorage.removeItem('username');
    localStorage.setItem('disclaimerStatus', 'false');
    localStorage.setItem('loginStatus', '0');
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
