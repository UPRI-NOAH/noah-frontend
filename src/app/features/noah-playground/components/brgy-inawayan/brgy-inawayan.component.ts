import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Component({
  selector: 'noah-brgy-inawayan',
  templateUrl: './brgy-inawayan.component.html',
  styleUrls: ['./brgy-inawayan.component.scss'],
})
export class BrgyInawayanComponent implements OnInit {
  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;
  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.brgyInawayanExpanded$.pipe(shareReplay(1));
    this.shown$ = this.pgService.brgyInawayanShown$.pipe(shareReplay(1));
  }

  toggleExpanded(event: Event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.pgService.toggleBarangayInawayanGroupProperty('expanded');
  }

  toggleShown(event: Event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.pgService.toggleBarangayInawayanGroupProperty('shown');
  }
}
