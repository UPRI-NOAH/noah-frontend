import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QuezonCityCriticalFacilities } from '@features/noah-playground/store/noah-playground.store';
import { Observable, Subject } from 'rxjs';

export const QC_CRITFAC_NAME: Record<QuezonCityCriticalFacilities, string> = {
  'qc-critical-facilities': 'Government-owned Facilities',
};

@Component({
  selector: 'noah-qc-critical-facilities',
  templateUrl: './qc-critical-facilities.component.html',
  styleUrls: ['./qc-critical-facilities.component.scss'],
})
export class QcCriticalFacilitiesComponent implements OnInit, OnDestroy {
  @Input() qcCriticalFacilities: QuezonCityCriticalFacilities;
  shown$: Observable<boolean>;

  private _unsub = new Subject();

  get qcCritFacName(): string {
    return QC_CRITFAC_NAME[this.qcCriticalFacilities];
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.shown$ = this.pgService.getQcCriticalFacilitiesShown$(
      this.qcCriticalFacilities
    );
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  toggleShown() {
    this.pgService.setQuezonCityCritFacTypeShown(this.qcCriticalFacilities);
  }
}
