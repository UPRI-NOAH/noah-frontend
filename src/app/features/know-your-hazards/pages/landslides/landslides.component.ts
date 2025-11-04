import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import {
  ExposureLevel,
  HazardType,
} from '@features/know-your-hazards/store/kyh.store';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Component({
  selector: 'noah-landslides',
  templateUrl: './landslides.component.html',
  styleUrls: ['./landslides.component.scss'],
})
export class LandslidesComponent implements OnInit {
  @Input() hazardType: HazardType = 'landslide';
  exposureLevel$: Observable<ExposureLevel>;
  constructor(private kyhService: KyhService, private router: Router) {}

  ngOnInit(): void {
    this.kyhService.setCurrentView('landslide');
    this.exposureLevel$ = this.kyhService
      .getExposureLevel$(this.hazardType)
      .pipe(shareReplay(1));
  }

  back(): void {
    this.router.navigateByUrl('/know-your-hazards');
    this.kyhService.setCurrentView('all');
  }

  getExposureClass(level: string | null): string {
    switch (level) {
      case 'high':
        return 'text-noah-red-high';
      case 'medium':
        return 'text-noah-red-medium';
      case 'low':
        return 'text-noah-red-low';
      case 'unavailable':
        return 'text-noah-red-unavailable';
      case 'little to none':
        return 'text-noah-black-high';
      default:
        return '';
    }
  }
}
