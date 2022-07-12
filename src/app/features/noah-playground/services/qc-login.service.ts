import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NoahPlaygroundService } from './noah-playground.service';

@Injectable({
  providedIn: 'root',
})
export class QcLoginService {
  private QCBASE_URL = 'https://noah-api.up.edu.ph';
  loginModal: boolean;
  qcadmin = 'QC Admin';
  isLoginModal: boolean = false;
  showAdminResult: boolean;
  tokenResp: any;

  private loginStatus = new BehaviorSubject<boolean>(this.checkLoginStatus());
  private UserName = new BehaviorSubject<string>(
    localStorage.getItem('username')
  );

  constructor(
    private http: HttpClient,
    private router: Router,
    private _location: Location,
    private pgService: NoahPlaygroundService
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
            localStorage.setItem('loginStatus', '1');
            localStorage.setItem('token', response.auth_token);
            localStorage.setItem('username', username);
            this.UserName.next(localStorage.getItem('username'));
            console.log('username', username);
          }
          return response;
        })
      );
  }

  isLoggedIn() {
    return localStorage.getItem('token') != null;
  }

  logout() {
    alert('Your Session expired');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
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
      this.pgService.toggleQuezonCitySensorsGroupShown();
      return true;
    }
    return false;
  }

  get isLoggesIn() {
    return this.loginStatus.asObservable();
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
