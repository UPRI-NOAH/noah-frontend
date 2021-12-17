import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Component({
  selector: 'noah-volcano-group',
  templateUrl: './volcano-group.component.html',
  styleUrls: ['./volcano-group.component.scss'],
})
export class VolcanoGroupComponent implements OnInit {
  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.volcanoGroupExpanded$.pipe(shareReplay(1));
    this.shown$ = this.pgService.volcanoGroupShown$.pipe(shareReplay(1));
  }

  toggleExpanded(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleVolcanoGroupProperty('expanded');
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleVolcanoGroupProperty('shown');
  }
}
