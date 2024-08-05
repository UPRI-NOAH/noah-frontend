import { Component, Input, OnInit } from '@angular/core';
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
  mobileMenuHeight: '0vh' | '50vh' | '90vh' | '100%' = '50vh';
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

    // check if mobile view or desktop view

    this.breakpointObserver
      .observe([
        Breakpoints.Small,
        Breakpoints.WebLandscape,
        Breakpoints.Medium,
        Breakpoints.TabletPortrait,
      ])
      .subscribe((state) => {
        const breakpoints = state.breakpoints;
        if (
          breakpoints[Breakpoints.WebLandscape] ||
          breakpoints[Breakpoints.Medium] ||
          breakpoints[Breakpoints.TabletPortrait]
        ) {
          this.isMobile = false;
          this.mobileMenuHeight = '100%';
        } else {
          this.isMobile = true;
          this.mobileMenuHeight = '50vh';
        }
      });
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

  enlargeMobileMenu(): void {
    if (this.mobileMenuHeight === '100%') return;

    this.isMenu = true;

    if (this.mobileMenuHeight === '50vh') {
      this.mobileMenuHeight = '90vh';
    }
  }

  reduceMobileMenu(): void {
    if (this.mobileMenuHeight === '100%') {
      this.isMenu = false;
    } else if (this.mobileMenuHeight === '90vh') {
      this.mobileMenuHeight = '50vh';
    } else if (this.mobileMenuHeight === '50vh') {
      this.isMenu = false;
    }
  }

  toggleMenu(): void {
    this.isMenu = !this.isMenu;
  }
}
