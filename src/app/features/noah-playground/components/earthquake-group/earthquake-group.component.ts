import { Component, OnInit } from '@angular/core';
import { EarthquakeType } from '@features/noah-playground/services/earthquake-data.service';
import { ModalService } from '@features/noah-playground/services/modal.service';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Component({
  selector: 'noah-earthquake-group',
  templateUrl: './earthquake-group.component.html',
  styleUrls: ['./earthquake-group.component.scss'],
})
export class EarthquakeGroupComponent implements OnInit {
  seismicTypeList: EarthquakeType[] = ['seismic-sensor'];

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(
    private pgService: NoahPlaygroundService,
    public modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.earthquakeGroupExpanded$.pipe(
      shareReplay(1)
    );
    this.shown$ = this.pgService.earthquakeGroupShown$.pipe(shareReplay(1));
  }

  earthquakeModalOpen() {
    this.modalService.earthquakeSummaryModalOpen();
  }

  toggleExpanded(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleEarthquakeGroupExpanded();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleEarthquakeGroupShown();
  }
}
