import { Component, Input, OnInit, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ModalService } from '@features/noah-playground/services/modal.service';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QcLoginService } from '@features/noah-playground/services/qc-login.service';
import { HAZARDS } from '@shared/mocks/hazard-types-and-levels';
import { Observable } from 'rxjs';
import {
  BreakpointObserver,
  BreakpointState,
  Breakpoints,
} from '@angular/cdk/layout';

@Component({
  selector: 'noah-noah-playground',
  templateUrl: './noah-playground.component.html',
  styleUrls: ['./noah-playground.component.scss'],
})
export class NoahPlaygroundComponent implements OnInit {
  currentLocationPg$: Observable<string>;
  searchTerm: string;
  disclaimerModal: boolean;
  @Input() qcLoginModal: boolean;
  isSidebarOpen: boolean = false;
  isLogoutAlert: boolean = false;
  isMenu: boolean = true;
  isMobile: boolean = false;
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
  userName: string;
  hideBoundaries = sessionStorage.getItem('loggedIn');

  height = 256; // Default height (64 * 4 = 256px)
  private initialTouchY = 0;
  private initialHeight = this.height;
  isVisible = false;

  constructor(
    private pgService: NoahPlaygroundService,
    private title: Title,
    private qcLoginService: QcLoginService,
    private modalService: ModalService,
    public breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.currentLocationPg$ = this.pgService.currentLocation$;
    this.title.setTitle('NOAH Studio');
    this.LoginStatus$ = this.qcLoginService.isLoggesIn;
    this.userName = sessionStorage.getItem('name');

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

    this.updateVisibility();
    window.addEventListener('resize', this.updateVisibility.bind(this));
  }

  updateVisibility() {
    // Update visibility based on window width
    const width = window.innerWidth;
    this.isVisible = width < 768; // Tailwind sm breakpoint is 640px, md is 768px
  }

  // Called when the user touches the screen
  onTouchStart(event: TouchEvent) {
    this.initialTouchY = event.touches[0].clientY;
    this.initialHeight = this.height;
  }

  // Called when the user moves their finger on the screen
  onTouchMove(event: TouchEvent) {
    const currentTouchY = event.touches[0].clientY;
    const deltaY = this.initialTouchY - currentTouchY; // Difference in Y direction
    const newHeight = this.initialHeight + deltaY;

    // Ensure that height doesn't go below a certain value or exceed a maximum
    const minHeight = 200; // Adjust as needed
    const maxHeight = window.innerHeight - 100; // Adjust as needed

    if (newHeight >= minHeight && newHeight <= maxHeight) {
      this.height = newHeight;
    }
  }

  selectPlace(selectedPlace) {
    this.pgService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.pgService.setCenter({ lat, lng });
  }

  isLoggedIn(): boolean {
    return sessionStorage.getItem('loggedIn') === 'true';
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

  toggleMenu(): void {
    this.isMenu = !this.isMenu;
  }
}
