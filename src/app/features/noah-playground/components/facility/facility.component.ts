import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { CriticalFacility } from '@shared/mocks/critical-facilities';
import { Subject } from 'rxjs';

@Component({
  selector: 'noah-facility',
  templateUrl: './facility.component.html',
  styleUrls: ['./facility.component.scss'],
})
export class FacilityComponent implements OnInit {
  @Input() name: CriticalFacility;

  initialOpacityValue: number = 75;
  shown = false;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    const { shown, opacity } = this.pgService.getCriticalFacility(this.name);
    this.shown = shown;
    this.initialOpacityValue = opacity;
  }

  changeOpacity(opacity: number) {
    this.pgService.setCriticalFacilityOpacity(opacity, this.name);
  }

  toggleShown() {
    this.shown = !this.shown;
    this.pgService.setCriticalFacilityShown(this.shown, this.name);
  }
}
