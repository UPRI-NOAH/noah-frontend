import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  HazardLevel,
  HazardLevelState,
  HazardType,
} from '@features/noah-playground/store/noah-playground.store';
import {
  NoahColor,
  NoahColorPalette,
  NoahColorSelection,
} from '@shared/mocks/noah-colors';
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
  initialCustomPalette?: NoahColorPalette;
  initialOpacityValue: number = 75;
  shown = false;

  get highOnly(): boolean {
    // Temporary -- should use ID instead
    return this.name === 'Debris Flow and Alluvial Fan';
  }

  private _unsub = new Subject();

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    const initialLevel: HazardLevelState = this.pgService.getHazardLevel(
      this.type,
      this.id
    );

    this.initialColorValue = initialLevel.color;
    this.initialCustomPalette = initialLevel.customPalette;
    this.initialOpacityValue = initialLevel.opacity;
    this.shown = initialLevel.shown;
  }

  ngOnDestroy() {
    this._unsub.next(null);
    this._unsub.complete();
  }

  changeColor(selection: NoahColorSelection) {
    this.pgService.setHazardTypeColor(
      selection.color,
      this.type,
      this.id,
      selection.customPalette
    );
  }

  changeOpacity(opacity: number) {
    this.pgService.setHazardLevelOpacity(opacity, this.type, this.id);
  }

  toggleShown() {
    this.shown = !this.shown;
    this.pgService.setHazardLevelShown(this.shown, this.type, this.id);
  }
}
