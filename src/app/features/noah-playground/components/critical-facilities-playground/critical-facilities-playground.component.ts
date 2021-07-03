import { Component, OnInit } from '@angular/core';
import { CRITICAL_FACILITIES_ARR } from '@shared/mocks/critical-facilities';

@Component({
  selector: 'noah-critical-facilities-playground',
  templateUrl: './critical-facilities-playground.component.html',
  styleUrls: ['./critical-facilities-playground.component.scss'],
})
export class CriticalFacilitiesPlaygroundComponent implements OnInit {
  isOpenedList;

  facilityList = CRITICAL_FACILITIES_ARR;

  constructor() {}

  ngOnInit(): void {}

  openMenu(source) {
    this.isOpenedList = source;
  }
  closeMenu() {
    this.isOpenedList = -1;
  }
}
