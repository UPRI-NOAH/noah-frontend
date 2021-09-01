import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { SensorsState } from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'noah-sensors-group',
  templateUrl: './sensors-group.component.html',
  styleUrls: ['./sensors-group.component.scss'],
})
export class SensorsGroupComponent implements OnInit {
  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.sensorsGroupExpanded$;
    this.shown$ = this.pgService.sensorsGroupShown$;
  }

  toggleExpansion() {
    this.pgService.toggleSensorsGroupExpanded();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleSensorsGroupShown();
  }
}
