import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  SENSORS,
  SensorType,
} from '@features/noah-playground/services/sensor.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-sensors-group',
  templateUrl: './sensors-group.component.html',
  styleUrls: ['./sensors-group.component.scss'],
})
export class SensorsGroupComponent implements OnInit {
  sensorTypes: SensorType[] = SENSORS;

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
