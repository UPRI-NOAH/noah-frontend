import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RiskModalService {
  constructor() {}

  private riskModal = new Subject<boolean>();
  riskModal$ = this.riskModal.asObservable();

  openRiskModal() {
    this.riskModal.next(true);
  }

  closeRiskModal() {
    this.riskModal.next(false);
  }
}
