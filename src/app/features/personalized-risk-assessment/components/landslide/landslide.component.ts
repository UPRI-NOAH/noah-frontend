import { Component, OnInit } from '@angular/core';
import { PraService } from '@features/personalized-risk-assessment/services/pra.service';
import { RiskLevel } from '@features/personalized-risk-assessment/store/pra.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-landslide',
  templateUrl: './landslide.component.html',
  styleUrls: ['./landslide.component.scss'],
})
export class LandslideComponent implements OnInit {
  riskLevel$: Observable<RiskLevel>;

  constructor(private praService: PraService) {
    this.riskLevel$ = this.praService.riskLevel$;
  }

  ngOnInit(): void {
    this.praService.setCurrentPage('landslide');
  }
}
