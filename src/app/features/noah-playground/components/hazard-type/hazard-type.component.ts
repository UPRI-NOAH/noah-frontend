import { Component, Input, OnInit } from '@angular/core';

// type HazardType = 'flood' | 'landslide' | 'storm-surge';
type HazardLevel = {
  id: string;
  name: string;
};

type Hazard = {
  name: string;
  type: string; // TO DO: turn to HazardType
  levels: HazardLevel[];
};

@Component({
  selector: 'noah-hazard-type',
  templateUrl: './hazard-type.component.html',
  styleUrls: ['./hazard-type.component.scss'],
})
export class HazardTypeComponent implements OnInit {
  @Input() hazard: Hazard;

  isOpenedList: boolean = true;

  constructor() {}

  ngOnInit(): void {}

  openMenu() {
    this.isOpenedList = true;
  }

  closeMenu() {
    this.isOpenedList = false;
  }
}
