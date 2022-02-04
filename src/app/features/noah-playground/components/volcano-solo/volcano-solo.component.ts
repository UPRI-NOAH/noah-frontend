import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { VolcanoType } from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-volcano-solo',
  templateUrl: './volcano-solo.component.html',
  styleUrls: ['./volcano-solo.component.scss'],
})
export class VolcanoSoloComponent implements OnInit {
  @Input() volcanoType: VolcanoType;

  initialOpacityValue: number = 75;
  shown = false;

  get displayName(): string {
    return this.volcanoType.replace('-', ' ');
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.pgService
      .getVolcano$(this.volcanoType)
      .pipe(first())
      .subscribe(({ shown, opacity }) => {
        this.shown = shown;
        this.initialOpacityValue = opacity;
      });
  }

  changeOpacity(opacity: number) {
    this.pgService.setVolcanoSoloOpacity(opacity, this.volcanoType);
  }

  toggleShown() {
    this.shown = !this.shown;
    this.pgService.setVolcanoSoloShown(this.shown, this.volcanoType);
  }
}
