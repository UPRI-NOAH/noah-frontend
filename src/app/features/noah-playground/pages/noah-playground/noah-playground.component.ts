import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QcLoginService } from '@features/noah-playground/services/qc-login.service';
import { HAZARDS } from '@shared/mocks/hazard-types-and-levels';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-noah-playground',
  templateUrl: './noah-playground.component.html',
  styleUrls: ['./noah-playground.component.scss'],
})
export class NoahPlaygroundComponent implements OnInit {
  currentLocationPg$: Observable<string>;
  searchTerm: string;
  isSidebarOpen: boolean = false;
  isMenu: boolean = true;
  isList;
  hazardTypes = HAZARDS;
  LoginStatus$: Observable<boolean>;
  UserName$: Observable<string>;
  DisclaimerStatus$: Observable<boolean>;
  constructor(
    private pgService: NoahPlaygroundService,
    private title: Title,
    private qcLoginService: QcLoginService
  ) {}

  ngOnInit(): void {
    this.currentLocationPg$ = this.pgService.currentLocation$;
    this.title.setTitle('NOAH Studio');
    this.LoginStatus$ = this.qcLoginService.isLoggesIn;
    this.UserName$ = this.qcLoginService.currentUserName;
    this.DisclaimerStatus$ = this.qcLoginService.isDisclaimerStatus;
  }

  selectPlace(selectedPlace) {
    this.pgService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.pgService.setCenter({ lat, lng });
  }

  onLogout() {
    this.qcLoginService.logout();
  }
}
