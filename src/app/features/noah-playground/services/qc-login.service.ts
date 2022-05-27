import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class QcLoginService {
  loginModal: boolean;
  qcadmin = 'QC Admin';
  showAdminResult: boolean;

  constructor() {}

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
