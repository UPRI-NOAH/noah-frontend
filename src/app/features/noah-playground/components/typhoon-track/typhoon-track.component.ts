import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { TyphoonTrackState } from '@features/noah-playground/store/noah-playground.store';

@Component({
  selector: 'noah-typhoon-track',
  templateUrl: './typhoon-track.component.html',
  styleUrls: ['./typhoon-track.component.scss'],
})
export class TyphoonTrackComponent implements OnInit {
  typhoonTrack: TyphoonTrackState;

  get expanded(): boolean {
    return this.typhoonTrack.expanded;
  }

  get opacity(): number {
    return this.typhoonTrack.opacity;
  }

  get shown(): boolean {
    return this.typhoonTrack.shown;
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.typhoonTrack = this.pgService.getTyphoonTrack();
  }

  changeOpacity(opacity: number) {
    this.typhoonTrack = {
      ...this.typhoonTrack,
      opacity,
    };

    this.pgService.setTyphoonTrack(this.typhoonTrack);
  }

  toggleExpand() {
    const expanded = !this.expanded;
    this.typhoonTrack = {
      ...this.typhoonTrack,
      expanded: expanded,
    };

    this.pgService.setTyphoonTrack(this.typhoonTrack);
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    const shown = !this.shown;
    this.typhoonTrack = {
      ...this.typhoonTrack,
      shown,
    };

    this.pgService.setTyphoonTrack(this.typhoonTrack);
  }
}
