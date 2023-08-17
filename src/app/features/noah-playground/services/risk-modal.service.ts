import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RiskModalService {
  constructor() {}

  private riskModal = new Subject<boolean>();
  riskModal$ = this.riskModal.asObservable();

  private btnRa = new Subject<boolean>();
  btnRa$ = this.btnRa.asObservable();

  openBtnRa() {
    this.btnRa.next(true);
  }

  closeBtnRa() {
    this.btnRa.next(false);
  }

  openRiskModal() {
    this.riskModal.next(true);
  }

  closeRiskModal() {
    this.riskModal.next(false);
  }
}
