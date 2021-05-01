import { Component, OnInit } from '@angular/core';
import { PraService } from '@features/personalized-risk-assessment/services/pra.service';
import { RiskLevel } from '@features/personalized-risk-assessment/store/pra.store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'noah-flood',
  templateUrl: './flood.component.html',
  styleUrls: ['./flood.component.scss'],
})
export class FloodComponent implements OnInit {
  riskLevel$: Observable<RiskLevel>;

  constructor(private praService: PraService) {
    this.riskLevel$ = this.praService.riskLevel$;
  }

  ngOnInit(): void {
    this.praService.setCurrentPage('flood');
  }
}
