import { Component, OnInit } from '@angular/core';
import { PraService } from '@features/personalized-risk-assessment/services/pra.service';

@Component({
  selector: 'noah-critical-facilities',
  templateUrl: './critical-facilities.component.html',
  styleUrls: ['./critical-facilities.component.scss'],
})
export class CriticalFacilitiesComponent implements OnInit {
  constructor(private praService: PraService) {}

  ngOnInit(): void {
    this.praService.setCurrentPage('critical-facilities');
  }
}
