import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-wind',
  templateUrl: './wind.component.html',
  styleUrls: ['./wind.component.scss'],
})
export class WindComponent implements OnInit {
  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.windExpanded$;
    this.shown$ = this.pgService.windShown$;
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleWindGroupVisibility();
  }

  toggleExpanded() {
    this.pgService.toggleWindGroupExpansion();
  }
}
