import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { SensorType } from '@features/noah-playground/services/sensor.service';
import { Observable } from 'rxjs';

export const SENSOR_NAMES: Record<SensorType, string> = {
  arg: 'Automated Rain Gauge',
  wlms: 'Water Level Monitoring System',
  aws: 'Automated Weather Stations',
  wlmsarg: 'Waterlevel & Rain',
};
@Component({
  selector: 'noah-sensor-solo',
  templateUrl: './sensor-solo.component.html',
  styleUrls: ['./sensor-solo.component.scss'],
})
export class SensorSoloComponent implements OnInit {
  @Input() sensorType: SensorType;

  shown$: Observable<boolean>;

  get sensorName(): string {
    return SENSOR_NAMES[this.sensorType];
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.shown$ = this.pgService.getSensorTypeShown$(this.sensorType);
  }

  toggleShown() {
    this.pgService.setSensorTypeShown(this.sensorType);
  }
}
