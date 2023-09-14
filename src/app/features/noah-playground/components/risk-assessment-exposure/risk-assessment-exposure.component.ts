import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { RiskAssessmentExposureType } from '@features/noah-playground/store/noah-playground.store';
import { first } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';
import { ModalService } from '@features/noah-playground/services/modal.service';

@Component({
  selector: 'noah-risk-assessment-exposure',
  templateUrl: './risk-assessment-exposure.component.html',
  styleUrls: ['./risk-assessment-exposure.component.scss'],
})
export class RiskAssessmentExposureComponent implements OnInit {
  @Input() exposureRiskType: RiskAssessmentExposureType;
  riskExposureShown$: Observable<boolean>;
  shown$ = new BehaviorSubject<boolean>(false);

  constructor(
    private pgService: NoahPlaygroundService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.riskExposureShown$ = this.pgService.riskAssessmentPopuShown$;
  }

  toggleShown() {
    const currentValue = this.shown$.getValue();
    if (currentValue) {
      // Toggle the value of shown$ using an if-else statement
      this.shown$.next(false); // If it's currently true, set it to false
      this.modalService.closeBtnRiskAssessment();
      this.pgService.toggleAffectedPopulationVisibilityFalse();
    } else {
      this.shown$.next(true); // If it's currently false, set it to true
    }
  }
}
