import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QcLoginService {
  private QCBASE_URL = 'http://05c7-136-158-11-9.ngrok.io';
  loginModal: boolean;
  qcadmin = 'QC Admin';
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
}
