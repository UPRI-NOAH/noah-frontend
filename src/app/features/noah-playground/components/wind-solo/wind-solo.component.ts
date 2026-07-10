import { Component, Input, OnInit } from '@angular/core';
import { WindType } from '@features/noah-playground/store/noah-playground.store';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { first } from 'rxjs';
@Component({
  selector: 'noah-wind-solo',
  templateUrl: './wind-solo.component.html',
  styleUrls: ['./wind-solo.component.scss'],
})
export class WindSoloComponent implements OnInit {
  @Input() windType: WindType;

  initialParticleCountValue: number = 1000;
  initialSpeedValue: number = 0.5;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.pgService
      .getWind$(this.windType)
      .pipe(first())
      .subscribe(({ particleCount, speed }) => {
        this.initialParticleCountValue = particleCount;
        this.initialSpeedValue = speed;
      });
    /*
    this.initialParticleCountValue = this.pgService.getWindParticleCount();
    this.initialSpeedValue = this.pgService.getWindSpeed();
    */
  }

  changeParticleCount(particleCount: number) {
    this.pgService.setWindParticleCount(particleCount, this.windType);
  }

  changeSpeed(speed: number) {
    this.pgService.setWindSpeed(speed, this.windType);
  }
}
