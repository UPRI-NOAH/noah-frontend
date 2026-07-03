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
  initialParticleCountValue: number = 600;
  initialSpeedValue: number = 0.5;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.windExpanded$;
    this.shown$ = this.pgService.windShown$;
    this.initialParticleCountValue = this.pgService.getWindParticleCount();
    this.initialSpeedValue = this.pgService.getWindSpeed();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleWindGroupVisibility();
  }

  toggleExpanded() {
    this.pgService.toggleWindGroupExpansion();
  }

  changeParticleCount(particleCount: number) {
    this.pgService.setWindParticleCount(particleCount);
  }

  changeSpeed(speed: number) {
    this.pgService.setWindSpeed(speed);
  }
}
