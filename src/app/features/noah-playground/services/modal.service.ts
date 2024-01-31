import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private riskModal = new Subject<boolean>();
  riskModal$ = this.riskModal.asObservable();

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

  private btnRiskAssessment = new Subject<boolean>();
  btnRiskAssessment$ = this.btnRiskAssessment.asObservable();

  private disclaimerModal = new Subject<boolean>();
  disclaimerModal$ = this.disclaimerModal.asObservable();

  private iotSummaryModal = new Subject<boolean>();
  iotSummaryModal$ = this.iotSummaryModal.asObservable();

  private legendHide = new Subject<boolean>();
  legendHide$ = this.legendHide.asObservable();

  private eaPopup = new Subject<boolean>();
  private popupShown = false;
  eaPopup$ = this.eaPopup.asObservable();

  constructor() {}

  hideEaPopup() {
    this.eaPopup.next(false);
  }

  showEaPopup() {
    // this.eaPopup.next(true);
    // Check if the popup has already been shown
    if (!this.popupShown) {
      this.eaPopup.next(true);
      this.popupShown = true; // Set the flag to true once the popup is shown
    }
  }

  hideLegend() {
    this.legendHide.next(false);
  }

  showLegend() {
    this.legendHide.next(true);
  }

  openBtnRiskAssessment() {
    this.btnRiskAssessment.next(true);
  }

  closeBtnRiskAssessment() {
    this.btnRiskAssessment.next(false);
  }

  disclaimerModalOpen() {
    this.disclaimerModal.next(true);
  }

  disclaimerModalClose() {
    this.disclaimerModal.next(false);
  }

  openRiskModal() {
    this.riskModal.next(true);
  }

  closeRiskModal() {
    this.riskModal.next(false);
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
