import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { HazardLevel } from '@features/noah-playground/store/noah-playground.store';
import { HazardType } from '@features/personalized-risk-assessment/store/pra.store';
import { NoahColor } from '@shared/mocks/noah-colors';
import { Subject } from 'rxjs';

@Component({
  selector: 'noah-hazard-level',
  templateUrl: './hazard-level.component.html',
  styleUrls: ['./hazard-level.component.scss'],
})
export class HazardLevelComponent implements OnInit, OnDestroy {
  @Input() id: HazardLevel;
  @Input() name: string;
  @Input() type: HazardType;

  initialColorValue: NoahColor = 'noah-red';
  initialOpacityValue: number = 75;
  shown = false;

  private _unsub = new Subject();

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.initialColorValue = this.pgService.getHazardColor(this.type, this.id);
    this.initialOpacityValue = this.pgService.getHazardLevelOpacity(
      this.type,
      this.id
    );

    this.shown = this.pgService.getHazardLevelShown(this.type, this.id);
  }

  ngOnDestroy() {
    this._unsub.next();
    this._unsub.complete();
  }

  changeColor(color: NoahColor) {
    this.pgService.setHazardTypeColor(color, this.type, this.id);
  }

  changeOpacity(opacity: number) {
    this.pgService.setHazardLevelOpacity(opacity, this.type, this.id);
  }

  toggleShown() {
    this.shown = !this.shown;
    this.pgService.setHazardLevelShown(this.shown, this.type, this.id);
  }
}
