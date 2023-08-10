import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { BarangayBoundary } from '@features/noah-playground/store/noah-playground.store';
import { Observable, Subject } from 'rxjs';

export const BARANGAY_BOUNDARY: Record<BarangayBoundary, string> = {
  'brgy-boundary': 'Barangay Boundary',
};

@Component({
  selector: 'noah-brgy-boundary',
  templateUrl: './brgy-boundary.component.html',
  styleUrls: ['./brgy-boundary.component.scss'],
})
export class BrgyBoundaryComponent implements OnInit {
  @Input() barangayBoundary: BarangayBoundary;
  shown$: Observable<boolean>;

  private _unsub = new Subject();

  get barangayName(): string {
    return BARANGAY_BOUNDARY[this.barangayBoundary];
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.shown$ = this.pgService.getBarangayBoundaryShown$(
      this.barangayBoundary
    );
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  toggleShown() {
    this.pgService.setBarangayBoundaryShown(this.barangayBoundary);
  }
}
