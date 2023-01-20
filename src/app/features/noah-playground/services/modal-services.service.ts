import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalServicesService {
  private loginAlert = new Subject<boolean>();
  loginAlert$ = this.loginAlert.asObservable();

  constructor() {}

  openModal() {
    this.loginAlert.next(true);
  }

  closeModal() {
    this.loginAlert.next(false);
  }
}
