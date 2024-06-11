import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

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

  private earthquakeSummaryModal = new Subject<boolean>();
  earthquakeSummaryModal$ = this.earthquakeSummaryModal.asObservable();

  private legendHide = new Subject<boolean>();
  legendHide$ = this.legendHide.asObservable();

  private eaPopup = new Subject<boolean>();
  private popupShown = false;
  eaPopup$ = this.eaPopup.asObservable();

  private simulateData = new Subject<void>();

  private simulateDataSubject = new BehaviorSubject<boolean>(false);
  simulateDatas$ = this.simulateDataSubject.asObservable();

  constructor() {}

  updateSimulateDataStatus() {
    const currentValue = this.simulateDataSubject.value;
    this.simulateDataSubject.next(!currentValue);
  }

  simulateBtnClick(): void {
    this.simulateData.next();
  }

  onSimulateClick(): Observable<void> {
    return this.simulateData.asObservable();
  }

  hideEaPopup() {
    this.eaPopup.next(false);
  }

  acceptHidePopup() {
    this.eaPopup.next(false);
    sessionStorage.clear(); // Clear the sessionStorage to force expiration
  }

  showEaPopup() {
    // Check if the timestamp indicating when the popup was last shown is present in sessionStorage
    const lastShownTimestamp = sessionStorage.getItem('popupShownTimestamp');

    if (!lastShownTimestamp || isExpired(lastShownTimestamp)) {
      // If the timestamp is not present or has expired, display the popup
      this.eaPopup.next(true);

      // Set the timestamp in sessionStorage to the current time
      sessionStorage.setItem('popupShownTimestamp', Date.now().toString());

      // Optionally, set a reload flag in sessionStorage to ensure the popup won't be shown again after a page refresh
      sessionStorage.setItem('reloadFlag', 'true');
    } else {
      // Check if the reload flag is set, if not, reset the sessionStorage
      const reloadFlag = sessionStorage.getItem('reloadFlag');
      if (!reloadFlag) {
        sessionStorage.clear();
      }
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
    console.log('open');
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

  earthquakeSummaryModalOpen() {
    this.earthquakeSummaryModal.next(true);
  }

  earthquakeSummaryModalClose() {
    this.earthquakeSummaryModal.next(false);
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
function isExpired(timestamp) {
  const currentTime = Date.now();
  const expirationTime = 24 * 60 * 60 * 1000; // 1 day in milliseconds
  //const expirationTime = 60 * 1000; // 1 minute in milliseconds fot testing
  return currentTime - parseInt(timestamp) > expirationTime;
}
