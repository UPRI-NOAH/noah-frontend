import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QuezonCitySensorType } from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-qc-sensors-group',
  templateUrl: './qc-sensors-group.component.html',
  styleUrls: ['./qc-sensors-group.component.scss'],
})
export class QcSensorsGroupComponent implements OnInit {
  qcSensorTypes: QuezonCitySensorType[] = ['sensor1', 'sensor2'];
  qcWeatherTypes: QuezonCitySensorType[] = ['sensor3', 'sensor4'];

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.qcSensorsGroupExpanded$;
    this.shown$ = this.pgService.qcSensorsGroupShown$;
  }

  toggleExpansion() {
    this.pgService.toggleQuezonCitySensorsGroupExpanded();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleQuezonCitySensorsGroupShown();
  }
}
