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
    if (!this.router.url.startsWith('/weather-updates')) {
      return;
    }
    const typhoonShown = this.wuService.getTyphoonTrack().shown;

    switch (this.router.url) {
      case '/weather-updates/typhoon-track':
        if (!typhoonShown) {
          this.wuService.activateTyphoonTrack();
          this.wuService.triggerZoomToTyphoon();
        }
        break;

      case '/weather-updates/rainfall-contour':
        this.wuService.activateRainfall();

        // Keep Typhoon checkbox in sync
        this.shown = typhoonShown;
        break;

      case '/weather-updates/temperature':
        this.wuService.activateTemperature();

        // Keep Typhoon checkbox in sync
        this.shown = typhoonShown;
        break;

      default:
        // If Typhoon Track is off but URL is still /typhoon-track,
        // redirect to the current active weather overlay.
        if (!typhoonShown) {
          this.router.navigateByUrl(
            this.wuService.getTemperatureShown()
              ? '/weather-updates/temperature'
              : '/weather-updates/rainfall-contour'
          );
        }
        break;
    }
    this.shown = typhoonShown;
  }

  toggleShown(event: Event): void {
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (!this.shown) {
      // Turn ON Typhoon Track
      this.wuService.activateTyphoonTrack();
      this.wuService.triggerZoomToTyphoon();
      this.router.navigateByUrl('/weather-updates/typhoon-track');
    } else {
      // Turn OFF Typhoon Track
      this.wuService.setTyphoonTrackVisibility(false);
      this.wuService.setWeatherSatelliteVisibility(false);

      // Navigate back to the active weather overlay
      this.router.navigateByUrl(this.wuService.getActiveWeatherRoute());
    }
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
    this.wuService.toggleTyphoonTrackGroupExpansion();
  }

  typhoonTrack(): void {
    this.shown = true;

    this.wuService.activateTyphoonTrack();
    this.wuService.triggerZoomToTyphoon();

    this.router.navigateByUrl('/weather-updates/typhoon-track');
  }
}
