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
  modalLogin: boolean = false;
  constructor(private modalService: ModalServicesService) {}

  ngOnInit(): void {
    this.modalService.loginAlert$.subscribe((isOpen) => {
      this.isOpen = isOpen;
    });
  }

  close() {
    this.modalService.closeModal();
  }
}
