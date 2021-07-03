import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  FloodState,
  HazardType,
  LandslideState,
  StormSurgeState,
} from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';

// type HazardType = 'flood' | 'landslide' | 'storm-surge';
type HazardLevel = {
  id: string;
  name: string;
};

type Hazard = {
  name: string;
  type: HazardType;
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
  hazard$: Observable<FloodState | StormSurgeState | LandslideState>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.hazard$ = this.pgService.getHazard$(this.hazard.type);
  }

  openMenu() {
    this.isOpenedList = true;
  }

  closeMenu() {
    this.isOpenedList = false;
  }
}
