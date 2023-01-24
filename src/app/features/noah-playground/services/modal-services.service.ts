import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalServicesService {
  private loginAlert = new Subject<boolean>();
  loginAlert$ = this.loginAlert.asObservable();

  private logoutAlert = new Subject<boolean>();
  logoutAlert$ = this.logoutAlert.asObservable();

  constructor() {}

  openModal() {
    this.loginAlert.next(true);
  }

  closeModal() {
    this.loginAlert.next(false);
  }

  openLogoutModal() {
    this.logoutAlert.next(true);
  }

  closeLogoutModal() {
    this.logoutAlert.next(false);
  }
}
