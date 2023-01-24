import { Component, OnInit } from '@angular/core';
import { ModalServicesService } from '@features/noah-playground/services/modal-services.service';
import { QcLoginService } from '@features/noah-playground/services/qc-login.service';
import { Subject } from 'rxjs';
@Component({
  selector: 'noah-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  showAlert = false;
  isOpen = false;
  isLogoutAlert = false;
  modalLogin: boolean = false;
  isOpenModal$ = new Subject<boolean>();

  constructor(
    private modalService: ModalServicesService,
    private qcLoginService: QcLoginService
  ) {}

  ngOnInit(): void {
    this.modalService.loginAlert$.subscribe((isOpen) => {
      this.isOpen = isOpen;
    });

    this.modalService.logoutAlert$.subscribe((isLogoutAlert) => {
      this.isLogoutAlert = isLogoutAlert;
    });
  }

  close() {
    this.modalService.closeModal();
    this.modalService.closeLogoutModal();
  }

  closeLogoutModal() {
    this.isOpenModal$.next(false);
  }

  processLogout() {
    this.qcLoginService.logout();
  }
}
