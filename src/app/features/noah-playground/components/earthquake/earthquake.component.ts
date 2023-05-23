import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-earthquake',
  templateUrl: './earthquake.component.html',
  styleUrls: ['./earthquake.component.scss'],
})
export class EarthquakeComponent implements OnInit {
  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.earthquakeExpanded$;
    this.shown$ = this.pgService.earthquakeShown$;
  }

  toggleExpansion() {
    this.pgService.toggleEarthquakeGroupExpanded();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.pgService.toggleEarthquakeGroupShown();
  }
}
