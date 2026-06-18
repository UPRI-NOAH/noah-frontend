import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { LIGHTNING_GROUP_ARR } from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-lightning-group',
  templateUrl: './lightning-group.component.html',
  styleUrls: ['./lightning-group.component.scss'],
})
export class LightningGroupComponent implements OnInit {
  isOpenedList;
  lightningTypes = LIGHTNING_GROUP_ARR;

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.lightningGroupExpanded$;
    this.shown$ = this.pgService.lightningGroupShown$;
  }

  toggleExpanded() {
    this.pgService.toggleLightningGroupExpanded();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleLightningGroupShown();
  }
}
