import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { TyphoonTrackType } from '@features/noah-playground/store/noah-playground.store';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-typhoon-track-solo',
  templateUrl: './typhoon-track-solo.component.html',
  styleUrls: ['./typhoon-track-solo.component.scss'],
})
export class TyphoonTrackSoloComponent implements OnInit {
  @Input() typhoonTrackType: TyphoonTrackType;

  initialOpacityValue: number = 75;
  shown = false;

  get displayName(): string {
    return this.typhoonTrackType.replace('-', ' ');
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.pgService
      .getTyphoonTrack$(this.typhoonTrackType)
      .pipe(first())
      .subscribe(({ shown, opacity }) => {
        this.shown = shown;
        this.initialOpacityValue = opacity;
      });
  }

  changeOpacity(opacity: number) {
    this.pgService.setTyphoonTrackSoloOpacity(opacity, this.typhoonTrackType);
  }

  toggleShown() {
    this.shown = !this.shown;
    this.pgService.setTyphoonTrackSoloShown(this.shown, this.typhoonTrackType);
  }
}
