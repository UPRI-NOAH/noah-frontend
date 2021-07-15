import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { RiskLevel } from '@features/know-your-hazards/store/kyh.store';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';

@Component({
  selector: 'noah-landslide-kyh',
  templateUrl: './landslide-kyh.component.html',
  styleUrls: ['./landslide-kyh.component.scss'],
})
export class LandslideKyhComponent implements OnInit {
  landslideRiskLevel$: Observable<RiskLevel>;

  constructor(private kyhService: KyhService) {
    this.landslideRiskLevel$ = this.kyhService.landslideRiskLevel$;
  }

  ngOnInit(): void {}

  back() {
    this.kyhService.setCurrentPage('know-your-hazards');
  }
}
