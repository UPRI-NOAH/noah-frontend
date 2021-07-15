import { Component, OnInit } from '@angular/core';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { RiskLevel } from '@features/know-your-hazards/store/kyh.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-storm-surge-kyh',
  templateUrl: './storm-surge-kyh.component.html',
  styleUrls: ['./storm-surge-kyh.component.scss'],
})
export class StormSurgeKyhComponent implements OnInit {
  stormSurgeRiskLevel$: Observable<RiskLevel>;

  constructor(private kyhService: KyhService) {
    this.stormSurgeRiskLevel$ = this.kyhService.stormSurgeRiskLevel$;
  }

  ngOnInit(): void {}

  back() {
    this.kyhService.setCurrentPage('know-your-hazards');
  }
}
