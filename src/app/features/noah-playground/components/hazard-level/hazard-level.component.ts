import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { HazardLevel } from '@features/noah-playground/store/noah-playground.store';
import { HazardType } from '@features/personalized-risk-assessment/store/pra.store';
import { NoahColor } from '@shared/mocks/noah-colors';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  shownCtrl: FormControl;

  private _unsub = new Subject();

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.initialColorValue = this.pgService.getHazardColor(this.type, this.id);
    this.initialOpacityValue = this.pgService.getHazardOpacity(
      this.type,
      this.id
    );

    this.shownCtrl = new FormControl(false);
    this.shownCtrl.valueChanges
      .pipe(takeUntil(this._unsub))
      .subscribe((v) => console.log(v, this.id));
  }

  ngOnDestroy() {
    this._unsub.next();
    this._unsub.complete();
  }

  changeColor(color: NoahColor) {
    this.pgService.setHazardColor(color, this.type, this.id);
  }

  changeOpacity(opacity: number) {
    this.pgService.setHazardOpacity(opacity, this.type, this.id);
  }
}
