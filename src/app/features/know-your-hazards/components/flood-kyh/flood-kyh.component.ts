import { Component, Input, OnInit } from '@angular/core';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { RiskLevel } from '@features/know-your-hazards/store/kyh.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-flood-kyh',
  templateUrl: './flood-kyh.component.html',
  styleUrls: ['./flood-kyh.component.scss'],
})
export class FloodKyhComponent implements OnInit {
  floodRiskLevel$: Observable<RiskLevel>;

  constructor(private kyhService: KyhService) {
    this.floodRiskLevel$ = this.kyhService.floodRiskLevel$;
  }

  ngOnInit(): void {}

  back() {
    this.kyhService.setCurrentPage('know-your-hazards');
  }
}
