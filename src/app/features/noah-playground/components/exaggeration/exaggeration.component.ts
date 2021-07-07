import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { ExaggerationState } from '@features/noah-playground/store/noah-playground.store';

@Component({
  selector: 'noah-exaggeration',
  templateUrl: './exaggeration.component.html',
  styleUrls: ['./exaggeration.component.scss'],
})
export class ExaggerationComponent implements OnInit {
  exaggeration: ExaggerationState;

  get expanded(): boolean {
    return this.exaggeration.expanded;
  }

  get level(): number {
    return this.exaggeration.level;
  }

  get shown(): boolean {
    return this.exaggeration.shown;
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    // The only time we get the value from the state directly is when we're
    // initializing the value
    this.exaggeration = this.pgService.getExaggeration();
  }

  changeExaggerationLevel(level: number) {
    this.exaggeration = {
      ...this.exaggeration,
      level,
    };

    this.pgService.setExaggeration(this.exaggeration);
  }

  toggleExpand() {
    const expanded = !this.expanded;
    this.exaggeration = {
      ...this.exaggeration,
      expanded: expanded,
    };

    this.pgService.setExaggeration(this.exaggeration);
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    const shown = !this.shown;
    this.exaggeration = {
      ...this.exaggeration,
      shown,
    };

    this.pgService.setExaggeration(this.exaggeration);
  }
}
