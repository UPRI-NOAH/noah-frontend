import { Component, OnInit } from '@angular/core';
import { PraService } from '@features/personalized-risk-assessment/services/pra.service';
import { RiskLevel } from '@features/personalized-risk-assessment/store/pra.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-storm-surge',
  templateUrl: './storm-surge.component.html',
  styleUrls: ['./storm-surge.component.scss'],
})
export class StormSurgeComponent implements OnInit {
  currentLocation$: Observable<string>;
  riskLevel$: Observable<RiskLevel>;

  constructor(private praService: PraService) {
    this.currentLocation$ = this.praService.currentLocation$;
    this.riskLevel$ = this.praService.riskLevel$;
  }

  ngOnInit(): void {
    this.praService.setCurrentPage('storm-surge');
  }
}
