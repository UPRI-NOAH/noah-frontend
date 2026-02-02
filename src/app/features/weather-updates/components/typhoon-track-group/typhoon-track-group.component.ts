import { Component, OnInit } from '@angular/core';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'noah-typhoon-track-group',
  templateUrl: './typhoon-track-group.component.html',
  styleUrls: ['./typhoon-track-group.component.scss'],
})
export class TyphoonTrackGroupComponent implements OnInit {
  expanded = true;
  shown = true;

  constructor(
    private wuService: WeatherUpdatesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Auto-enable typhoon track and himawari satellite if navigating directly to this page
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.autoEnableFeatures();
      });
    this.autoEnableFeatures();

    this.wuService.typhoonTrackShown$.subscribe((shown) => {
      this.shown = shown;
    });

    this.wuService.typhoonTrackExpanded$.subscribe((expanded) => {
      this.expanded = expanded;
    });
  }

  private autoEnableFeatures(): void {
    if (this.router.url === '/weather-updates/typhoon-track') {
      const typhoonTrack = this.wuService.getTyphoonTrack();
      const weatherSatellite = this.wuService.getWeatherSatellites();
      const selectedType = this.wuService.getSelectedRainfallContourType();
      this.wuService.setRainfallContourOpacity(0, selectedType);

      if (!typhoonTrack.shown || !weatherSatellite.shown) {
        this.shown = true; // ✅ sync checkbox UI
        this.wuService.enableTyphoonTrackAndSatellite();
        this.wuService.triggerZoomToTyphoon();
      }
    } else {
      const selectedType = this.wuService.getSelectedRainfallContourType();
      this.wuService.setRainfallContourOpacity(100, selectedType);
    }
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.shown = !this.shown;
    this.wuService.toggleTyphoonTrackGroupVisibility(this.shown);
    this.wuService.toggleWeatherSatelliteVisibility();

    const selectedType = this.wuService.getSelectedRainfallContourType();

    // Zoom when shown
    if (this.shown) {
      this.wuService.triggerZoomToTyphoon();
    }

    // Update opacity based on route
    if (
      this.router.url === '/weather-updates/typhoon-track' ||
      this.router.url === '/weather-updates/rainfall-contour'
    ) {
      if (this.shown) {
        this.wuService.setRainfallContourOpacity(0, selectedType);
      } else {
        this.wuService.setRainfallContourOpacity(100, selectedType);
      }
    }

    // ✅ Update URL based on checkbox state
    if (this.shown) {
      this.router.navigate(['/weather-updates/typhoon-track']);
    } else {
      this.router.navigate(['/weather-updates/rainfall-contour']);
    }
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
    this.wuService.toggleTyphoonTrackGroupExpansion();
  }

  typhoonTrack() {
    // Set opacity to 0 for all rainfall contour types
    ['1hr', '3hr', '6hr', '12hr', '24hr'].forEach((type) => {
      this.wuService.setRainfallContourOpacity(0, type as any);
    });
    this.wuService.enableTyphoonTrackAndSatellite();
    this.router.navigate(['weather-updates/typhoon-track']);
  }
}
