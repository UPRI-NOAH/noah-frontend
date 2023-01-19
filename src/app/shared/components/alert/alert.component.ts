import { Component, OnInit } from '@angular/core';
import { ModalServicesService } from '@features/noah-playground/services/modal-services.service';
@Component({
  selector: 'noah-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  showAlert = false;
  isOpen = false;
  logoutAlert = false;
  modalLogin: boolean = false;
  constructor(private modalService: ModalServicesService) {}

  ngOnInit(): void {
    this.modalService.loginAlert$.subscribe((isOpen) => {
      this.isOpen = isOpen;
    });

    this.modalService.logoutAlert$.subscribe((logoutAlert) => {
      this.logoutAlert = logoutAlert;
    });
  }

  close() {
    this.modalService.closeModal();
  }

  onCloseClick() {
    this.showAlert = !this.showAlert;
  }

  modalBtn() {
    this.modalLogin = !this.modalLogin;
  }
}
