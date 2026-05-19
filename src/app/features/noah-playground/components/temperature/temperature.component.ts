import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { TEMPERATURE } from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-temperature',
  templateUrl: './temperature.component.html',
  styleUrls: ['./temperature.component.scss'],
})
export class TemperatureComponent implements OnInit {
  isOpenedList;
  temperature = TEMPERATURE;

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  selectedTempType$: Observable<string>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.temperatureExpanded$;
    this.shown$ = this.pgService.temperatureShown$;
    this.selectedTempType$ = this.pgService.selectedTemperature$;
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleTemperatureGroupVisibility();
  }

  toggleExpanded() {
    this.pgService.toggleTemperatureGroupExpansion();
  }
}
