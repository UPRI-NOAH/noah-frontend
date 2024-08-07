import { Component, OnInit, Input } from '@angular/core';
import { ModalService } from '@features/noah-playground/services/modal.service';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  CalculateRiskButton,
  RiskAssessmentExposureType,
  RiskAssessmentRainType,
} from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';
import { shareReplay, first } from 'rxjs/operators';

@Component({
  selector: 'noah-risk-assessment-group',
  templateUrl: './risk-assessment-group.component.html',
  styleUrls: ['./risk-assessment-group.component.scss'],
})
export class RiskAssessmentGroupComponent implements OnInit {
  riskAssessmentRainTypeList: RiskAssessmentRainType[] = ['rain-forecast'];
  riskAssessmentExposureTypeList: RiskAssessmentExposureType[] = ['population'];
  @Input() btnCalculateRisk: CalculateRiskButton;
  @Input() rainForecast: RiskAssessmentRainType;
  @Input() populationAffected: RiskAssessmentExposureType;

  expanded$: Observable<boolean>;
  riskAssessmentPopuShown$: Observable<boolean>;
  shown$: Observable<boolean>;
  expandedValue: boolean = false;
  initialRainOpacityValue: number = 80;
  initialPopuOpacityValue: number = 80;

  isButtonEnabled: boolean = false;
  checkedRain = true;
  checkedPopu = false;
  checkedShown = false;

  popuLegend = false;

  get isExpanded(): boolean {
    return this.expandedValue;
  }

  constructor(
    private pgService: NoahPlaygroundService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.modalService.legendHide$.subscribe((hideLegend) => {
      this.popuLegend = hideLegend;
    });

    this.expanded$ = this.pgService.riskAssessmentGroupExpanded$.pipe(
      shareReplay(1)
    );
    this.shown$ = this.pgService.riskAssessmentGroupShown$.pipe(shareReplay(1));
    this.pgService.riskAssessmentExpoShown$;

    this.pgService
      .getCalculateRiskBtn(this.btnCalculateRisk)
      .pipe(first())
      .subscribe(({ shown }) => {
        this.isButtonEnabled = shown;
      });

    this.pgService
      .getRainRiskAssessment$(this.rainForecast)
      .pipe(first())
      .subscribe(
        (result) => {
          if (result && result.opacity !== undefined) {
            this.initialRainOpacityValue = result.opacity;
          } else {
            // Handle the case where result or opacity is undefined
            this.initialRainOpacityValue = 80; // or some default value
          }
        },
        (error) => {
          // Handle the error case
          console.error('Error fetching rain risk assessment:', error);
        }
      );

    this.pgService
      .getPopulationExposure$(this.populationAffected)
      .pipe(first())
      .subscribe(({ opacity }) => {
        this.initialPopuOpacityValue = opacity;
      });
  }

  changeRainOpacity(opacity: number) {
    this.pgService.setRainForeCastOpacity(opacity, this.rainForecast);
  }

  changePopuOpacity(opacity: number) {
    this.pgService.setPopulationOpacity(opacity, this.populationAffected);
  }

  toggleExpanded(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.expandedValue = !this.expandedValue;
    this.pgService.toggleRiskAssessmentGroupProperty(
      'expanded',
      this.expandedValue
    );
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.checkedShown = (event.target as HTMLInputElement).checked;
    this.updateButtonEnabled();
    this.expandedValue = true;
    if (!this.checkedShown) {
      this.modalService.closeBtnRiskAssessment();
      this.popuLegend = false;
      this.pgService.toggleAffectedPopulationVisibilityFalse();
      this.pgService.toggleRiskAssessmentGroupProperty('shown', false);
      this.pgService.toggleRiskAssessmentGroupProperty(
        'expanded',
        (this.expandedValue = false)
      );
    } else {
      this.pgService.toggleRiskAssessmentGroupProperty('shown', true);
      this.pgService.toggleRiskAssessmentGroupProperty(
        'expanded',
        this.expandedValue
      );
      this.modalService.showEaPopup();
    }
  }

  toggleRain(events: Event) {
    events.stopPropagation();
    events.stopImmediatePropagation();
    this.checkedRain = (events.target as HTMLInputElement).checked;
    this.updateButtonEnabled();
  }

  togglePopu(events: Event) {
    events.stopPropagation();
    events.stopImmediatePropagation();
    this.checkedPopu = (events.target as HTMLInputElement).checked;
    this.updateButtonEnabled();
    if (!this.checkedPopu) {
      this.popuLegend = false;
      this.modalService.closeBtnRiskAssessment();
    }
  }

  calculateRisk() {
    this.modalService.openRiskModal();
    this.popuLegend = true;
    this.pgService.toggleAffectedPopulationVisibility();
  }

  updateButtonEnabled() {
    this.isButtonEnabled = !this.isButtonEnabled;
    this.pgService.setBtnCalculateRiskShown(
      this.isButtonEnabled,
      this.btnCalculateRisk
    );
    this.isButtonEnabled =
      this.checkedPopu && this.checkedRain && this.checkedShown;
  }
}
