import { Component, OnInit } from '@angular/core';
import { ModalService } from '@features/noah-playground/services/modal.service';
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
  eaPopup = false;

  constructor(
    private modalService: ModalService,
    private qcLoginService: QcLoginService
  ) {}

  ngOnInit(): void {
    this.modalService.loginAlert$.subscribe((isOpen) => {
      this.isOpen = isOpen;
    });

    this.modalService.logoutAlert$.subscribe((isLogoutAlert) => {
      this.isLogoutAlert = isLogoutAlert;
    });

    this.modalService.eaPopup$.subscribe((eaPopup) => {
      this.eaPopup = eaPopup;
    });
  }

  openModal() {
    const municityValue = JSON.parse(localStorage.getItem('municity'));
    if (municityValue === 'quezon_city') {
      this.modalService.qcLoginPopUp();
      this.modalService.closeModal();
    } else {
      this.modalService.lagunaLoginPopup();
      this.modalService.closeModal();
    }
  }

  close() {
    this.modalService.closeModal();
    this.modalService.closeLogoutModal();
    this.modalService.acceptHidePopup();
  }

  acceptPopup() {
    this.modalService.hideEaPopup();
  }

  processLogout() {
    this.qcLoginService.logout();
  }
}
