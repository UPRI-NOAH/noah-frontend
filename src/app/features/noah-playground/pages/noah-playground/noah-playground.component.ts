import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ModalService } from '@features/noah-playground/services/modal.service';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QcLoginService } from '@features/noah-playground/services/qc-login.service';
import { HAZARDS } from '@shared/mocks/hazard-types-and-levels';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'noah-noah-playground',
  templateUrl: './noah-playground.component.html',
  styleUrls: ['./noah-playground.component.scss'],
})
export class NoahPlaygroundComponent implements OnInit {
  //userName$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  currentLocationPg$: Observable<string>;
  searchTerm: string;
  disclaimerModal: boolean;
  @Input() qcLoginModal: boolean;
  isSidebarOpen: boolean = false;
  isLogoutAlert: boolean = false;
  isMenu: boolean = true;
  isList;
  hazardTypes = HAZARDS;
  LoginStatus$: Observable<boolean>;
  UserName$: Observable<string>;
  showAlert: boolean;
  modalAlert: boolean;
  qcAdmin: boolean;
  lagunaAdmin: boolean;
  isWarningAlert = false;
  disclaimerModalOpen = false;
  iotModalOpen = false;
  raBtnPopu = false;
  userName: string | null = null;
  localStorageCheckInterval: any;
  hideBoundaries = localStorage.getItem('loggedIn');
  constructor(
    private pgService: NoahPlaygroundService,
    private title: Title,
    private qcLoginService: QcLoginService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.currentLocationPg$ = this.pgService.currentLocation$;
    this.title.setTitle('NOAH Studio');
    this.LoginStatus$ = this.qcLoginService.isLoggesIn;
    this.userName = localStorage.getItem('name');
    // Set up an interval to check for updates to localStorage
    this.localStorageCheckInterval = setInterval(() => {
      const name = localStorage.getItem('name');
      if (this.userName !== name) {
        this.userName = name; // Update the view if the name has changed
        this.updateAdminStatus(this.userName);
        console.log('1');
      }
    }, 100); // Check every second (you can adjust the interval)

    this.modalService.btnRiskAssessment$.subscribe((raBtnPopu) => {
      this.raBtnPopu = raBtnPopu;
    });

    this.modalService.accountWarning$.subscribe((isWarningAlert) => {
      this.isWarningAlert = isWarningAlert;
    });

    this.modalService.disclaimerModal$.subscribe((disclaimerModal) => {
      this.disclaimerModalOpen = disclaimerModal;
    });

    this.modalService.iotSummaryModal$.subscribe((iotModalOpen) => {
      this.iotModalOpen = iotModalOpen;
    });
    3;

    const disableAlert = localStorage.getItem('loginStatus');
    if (disableAlert == '1') {
      this.showAlert = false;
      this.modalAlert = false;
    } else {
      this.showAlert = true;
      this.modalAlert = true;
    }
    const admin = localStorage.getItem('loginStatus');
    if (admin == '0') {
      this.qcAdmin = false;
      this.lagunaAdmin = false;
    }
    if (admin == '1') {
      this.qcAdmin = true;
      this.lagunaAdmin = false;
    }
    if (admin == '2') {
      this.lagunaAdmin = true;
      this.qcAdmin = false;
    }
  }

  ngOnDestroy() {
    if (this.localStorageCheckInterval) {
      clearInterval(this.localStorageCheckInterval); // Clean up when the component is destroyed
    }
  }
  selectPlace(selectedPlace) {
    this.pgService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.pgService.setCenter({ lat, lng });
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('loggedIn') === 'true';
  }

  processLogout() {
    this.qcLoginService.logout();
  }

  openLogoutModal() {
    this.isLogoutAlert = true;
  }

  openModalPopu() {
    this.modalService.openRiskModal();
  }

  closeBtnRisk() {
    this.raBtnPopu = false;
    this.modalService.hideLegend();
    this.pgService.toggleAffectedPopulationVisibilityFalse();
  }

  closeModal() {
    this.isLogoutAlert = false;
  }

  closeWarning() {
    this.modalService.warningClose();
  }

  logout(): void {
    this.qcLoginService.logout();
  }

  private updateAdminStatus(name: string | null) {
    if (name) {
      // Example logic to determine admin status
      if (name === 'qc admin') {
        this.qcAdmin = true;
        this.lagunaAdmin = false;
      } else if (name === 'laguna admin') {
        this.qcAdmin = false;
        this.lagunaAdmin = true;
      } else {
        this.qcAdmin = false;
        this.lagunaAdmin = false;
      }
    } else {
      // If no name, reset admin statuses
      this.qcAdmin = false;
      this.lagunaAdmin = false;
    }
  }
}
