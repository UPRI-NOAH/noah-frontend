import { Component, OnInit, Input } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  ExposureType,
  RiskAssessmentType,
} from '@features/noah-playground/services/risk-assessment.service';
import { RiskGroupType } from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';

import { first } from 'rxjs/operators';
@Component({
  selector: 'noah-risk-exposure',
  templateUrl: './risk-exposure.component.html',
  styleUrls: ['./risk-exposure.component.scss'],
})
export class RiskExposureComponent implements OnInit {
  riskAssessmentRain: RiskAssessmentType[] = ['rain'];
  exposureTypes: ExposureType[] = ['population', 'buildings'];
  @Input() riskType: RiskGroupType;

  shown = false;
  initialOpacityValue: number = 100;

  exposureShown$: Observable<boolean>;
  selectedExposureType$: Observable<ExposureType>;

  riskGroupShown$: Observable<boolean>;

  checkedRain = false;
  checkedExp = false;
  isRadioEnabled = false;
  isCheckedExp = false;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.pgService
      .getRisk$(this.riskType)
      .pipe(first())
      .subscribe(({ shown, opacity }) => {
        this.shown = shown;
        this.initialOpacityValue = opacity;
      });
  }

  selectExposure(type: ExposureType) {
    this.pgService.selectExposureType(type);
  }

  toggleRain(events: Event) {
    events.stopPropagation();
    events.stopImmediatePropagation();
    this.checkedRain = (events.target as HTMLInputElement).checked;
    this.updateRadioEnabled();
  }

  toggleExposure(events: Event) {
    this.shown = !this.shown;
    this.pgService.setRiskSoloShown(this.shown, this.riskType);
    //this.pgService.toggleExposureTypeVisibility()
    this.checkedExp = (events.target as HTMLInputElement).checked;
    this.updateRadioEnabled();
  }

  updateRadioEnabled() {
    this.isRadioEnabled = this.checkedRain && this.checkedExp;
  }
}
