import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { BoundariesType } from '@features/noah-playground/store/noah-playground.store';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-boundaries-solo',
  templateUrl: './boundaries-solo.component.html',
  styleUrls: ['./boundaries-solo.component.scss'],
})
export class BoundariesSoloComponent implements OnInit {
  @Input() boundariesType: BoundariesType;

  initialOpacityValue: number = 80;
  shown = false;

  get displayName(): string {
    return this.boundariesType.replace('-', ' ');
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.pgService
      .getBoundaries$(this.boundariesType)
      .pipe(first())
      .subscribe(({ shown, opacity }) => {
        this.shown = shown;
        this.initialOpacityValue = opacity;
      });
  }

  changeOpacity(opacity: number) {
    this.pgService.setBoundariesSoloOpacity(opacity, this.boundariesType);
  }

  toggleShown() {
    this.shown = !this.shown;
    this.pgService.setBoundariesSoloShown(this.shown, this.boundariesType);
  }
}
