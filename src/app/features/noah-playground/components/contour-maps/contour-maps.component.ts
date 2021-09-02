import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { CRITICAL_FACILITIES_ARR } from '@shared/mocks/critical-facilities';

@Component({
  selector: 'noah-contour-maps',
  templateUrl: './contour-maps.component.html',
  styleUrls: ['./contour-maps.component.scss'],
})
export class ContourMapsComponent implements OnInit {
  isOpenedList;
  facilityList = CRITICAL_FACILITIES_ARR;

  expanded = true;
  shown = true;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    const { expanded, shown } = this.pgService.getCriticalFacilities();
    this.expanded = expanded;
    this.shown = shown;
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.shown = !this.shown;
    this.pgService.setCriticalFacilitiesProperty(this.shown, 'shown');
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
    this.pgService.setCriticalFacilitiesProperty(this.expanded, 'expanded');
  }
}
