import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  TYPHOON,
  TyphoonTrackService,
  TyphoonTrackType,
} from '@features/noah-playground/services/typhoon-track.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-typhoon-track-group',
  templateUrl: './typhoon-track-group.component.html',
  styleUrls: ['./typhoon-track-group.component.scss'],
})
export class TyphoonTrackGroupComponent implements OnInit {
  typhoonTrackTypes: TyphoonTrackType[] = TYPHOON;

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;
  typhoonName: string;

  constructor(private pgService: NoahPlaygroundService) {}

  displayLegend = [
    {
      src: 'assets/legends/typhoon-track/LPA.png',
      name: 'low pressure area (LPA)',
    },
    {
      src: 'assets/legends/typhoon-track/TD.png',
      name: 'tropical depression (TD)',
    },
    { src: 'assets/legends/typhoon-track/TS.png', name: 'tropical storm (TS)' },
    {
      src: 'assets/legends/typhoon-track/STS.png',
      name: 'severe tropical storm (STS)',
    },
    { src: 'assets/legends/typhoon-track/TY.png', name: 'typhoon (TY)' },
    {
      src: 'assets/legends/typhoon-track/STY.png',
      name: 'super typhoon (STY)',
    },
  ];

  ngOnInit(): void {
    this.expanded$ = this.pgService.typhoonTrackGroupExpanded$;
    this.shown$ = this.pgService.typhoonTrackGroupShown$;
  }

  toggleExpanded() {
    this.pgService.toggleTyphoonTrackExpanded();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleTyphoonTrackGroupShown();
  }
}
