import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { Observable } from 'rxjs';
@Component({
  selector: 'noah-windy-playground',
  templateUrl: './windy-playground.component.html',
  styleUrls: ['./windy-playground.component.scss'],
})
export class WindyPlaygroundComponent implements OnInit {
  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.windyExpanded$;
    this.shown$ = this.pgService.windyShown$;
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.pgService.toggleWindyVisibility();
  }
  toggleExpanded() {
    this.pgService.toggleWindyExpansion();
  }
}
