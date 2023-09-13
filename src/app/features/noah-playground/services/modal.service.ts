import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private loginAlert = new Subject<boolean>();
  loginAlert$ = this.loginAlert.asObservable();

  private logoutAlert = new Subject<boolean>();
  logoutAlert$ = this.logoutAlert.asObservable();

  private accountWarning = new Subject<boolean>();
  accountWarning$ = this.accountWarning.asObservable();

  private qcLogin = new Subject<boolean>();
  qcLogin$ = this.qcLogin.asObservable();

  private lagunaLogin = new Subject<boolean>();
  lagunaLogin$ = this.lagunaLogin.asObservable();

  private disclaimerModal = new Subject<boolean>();
  disclaimerModal$ = this.disclaimerModal.asObservable();

  private iotSummaryModal = new Subject<boolean>();
  iotSummaryModal$ = this.iotSummaryModal.asObservable();

  constructor() {}

  disclaimerModalOpen() {
    this.disclaimerModal.next(true);
  }

  disclaimerModalClose() {
    this.disclaimerModal.next(false);
  }

  iotSummaryModalOpen() {
    this.iotSummaryModal.next(true);
  }

  iotSummaryModalClose() {
    this.iotSummaryModal.next(false);
  }

  lagunaLoginPopup() {
    this.lagunaLogin.next(true);
  }

  lagunaLoginClose() {
    this.lagunaLogin.next(false);
  }

  qcLoginPopUp() {
    this.qcLogin.next(true);
  }
  qcLoginClose() {
    this.qcLogin.next(false);
  }

  warningPopup() {
    this.accountWarning.next(true);
  }
  warningClose() {
    this.accountWarning.next(false);
  }

  openLoginModal() {
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
