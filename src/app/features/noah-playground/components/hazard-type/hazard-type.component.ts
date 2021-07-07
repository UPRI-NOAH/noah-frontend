import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  FloodState,
  HazardLevel,
  HazardType,
  LandslideState,
  StormSurgeState,
} from '@features/noah-playground/store/noah-playground.store';

type HazardLevelZ = {
  id: HazardLevel;
  name: string;
};

type Hazard = {
  name: string;
  type: HazardType;
  levels: HazardLevelZ[];
};

@Component({
  selector: 'noah-hazard-type',
  templateUrl: './hazard-type.component.html',
  styleUrls: ['./hazard-type.component.scss'],
})
export class HazardTypeComponent implements OnInit {
  @Input() hazard: Hazard;
  hazardState: FloodState | LandslideState | StormSurgeState;

  isOpenedList: boolean = true;

  get expanded(): boolean {
    return this.hazardState.expanded;
  }

  get shown(): boolean {
    return this.hazardState.shown;
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.hazardState = this.pgService.getHazard(this.hazard.type);
  }

  toggleExpansion() {
    const expanded = !this.expanded;
    this.hazardState = {
      ...this.hazardState,
      expanded,
    };

    this.pgService.setHazardExpansion(this.hazard.type, this.hazardState);
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    const shown = !this.shown;
    this.hazardState = {
      ...this.hazardState,
      shown,
    };

    this.pgService.setHazardTypeShown(this.hazard.type, this.hazardState);
  }
}
