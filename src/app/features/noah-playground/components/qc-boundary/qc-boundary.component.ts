import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QuezonCityMunicipalBoundary } from '@features/noah-playground/store/noah-playground.store';
import { Observable, Subject } from 'rxjs';

export const QC_MUNIBOUNDARY_NAME: Record<QuezonCityMunicipalBoundary, string> =
  {
    'qc-municipal-boundary': 'Municipal Boundary',
  };
@Component({
  selector: 'noah-qc-boundary',
  templateUrl: './qc-boundary.component.html',
  styleUrls: ['./qc-boundary.component.scss'],
})
export class QcBoundaryComponent implements OnInit, OnDestroy {
  @Input() qcMunicipalBoundary: QuezonCityMunicipalBoundary;

  shown$: Observable<boolean>;

  private _unsub = new Subject();

  get qcMuniBoudaryName(): string {
    return QC_MUNIBOUNDARY_NAME[this.qcMunicipalBoundary];
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.shown$ = this.pgService.getQcMunicipalBoundaryShown$(
      this.qcMunicipalBoundary
    );
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  toggleShown() {
    this.pgService.setQuezonCityMuniBoundaryTypeShown(this.qcMunicipalBoundary);
  }
}
