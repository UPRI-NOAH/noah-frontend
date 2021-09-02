import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { ContourMapType } from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-contour-maps',
  templateUrl: './contour-maps.component.html',
  styleUrls: ['./contour-maps.component.scss'],
})
export class ContourMapsComponent implements OnInit {
  contourMaps: ContourMapType[] = ['1hr', '3hr', '6hr', '12hr', '24hr'];

  expanded$: Observable<boolean>;
  selectedContourMap$: Observable<ContourMapType>;
  shown$: Observable<boolean>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.contourMapGroupExpanded$;
    this.selectedContourMap$ = this.pgService.selectedContourMap$;
    this.shown$ = this.pgService.contourMapGroupShown$;
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleContourMapGroupVisibility();
  }

  toggleExpanded() {
    this.pgService.toggleContourMapGroupExpansion();
  }

  selectContourMap(type: ContourMapType) {
    this.pgService.selectContourMapType(type);
  }
}
