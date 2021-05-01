import { Component, OnInit } from '@angular/core';
import { PraService } from '@features/personalized-risk-assessment/services/pra.service';

@Component({
  selector: 'noah-personal-risk',
  templateUrl: './personal-risk.component.html',
  styleUrls: ['./personal-risk.component.scss'],
})
export class PersonalRiskComponent implements OnInit {
  constructor(private praService: PraService) {}

  ngOnInit(): void {
    this.praService.init();
  }
}
