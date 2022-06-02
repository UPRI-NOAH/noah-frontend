import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QcLoginService {
  loginModal: boolean;
  qcadmin = 'QC Admin';
  showAdminResult: boolean;

  constructor(private http: HttpClient) {}

  loginUser(userData): Observable<any> {
    return this.http.post(
      'http://c8d3-136-158-11-9.ngrok.io/api/auth/token/login/',
      userData
    );
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
