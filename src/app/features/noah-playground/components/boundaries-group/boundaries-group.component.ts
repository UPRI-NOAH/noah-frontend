import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { BoundariesType } from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Component({
  selector: 'noah-boundaries-group',
  templateUrl: './boundaries-group.component.html',
  styleUrls: ['./boundaries-group.component.scss'],
})
export class BoundariesGroupComponent implements OnInit {
  boundariesTypeList: BoundariesType[] = ['barangay-boundary'];

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.boundariesGroupExpanded$.pipe(
      shareReplay(1)
    );
    this.shown$ = this.pgService.boundariesGroupShown$.pipe(shareReplay(1));
  }

  toggleExpanded(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleBoundariesGroupProperty('expanded');
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleBoundariesGroupProperty('shown');
  }
}
