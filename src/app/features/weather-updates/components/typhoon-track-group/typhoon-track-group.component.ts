import { Component, OnInit } from '@angular/core';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
import { Router } from '@angular/router';
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
    this.autoEnableFeatures();

    this.wuService.typhoonTrackShown$.subscribe((shown) => {
      this.shown = shown;
    });

    this.wuService.typhoonTrackExpanded$.subscribe((expanded) => {
      this.expanded = expanded;
    });
  }

  private autoEnableFeatures(): void {
    //only auto-enable if the current route is exactly '/weather-updates/typhoon-track'
    if (this.router.url === '/weather-updates/typhoon-track') {
      const typhoonTrack = this.wuService.getTyphoonTrack();
      const weatherSatellite = this.wuService.getWeatherSatellites();
      //only enable if not already enabled
      if (!typhoonTrack.shown || !weatherSatellite.shown) {
        this.wuService.enableTyphoonTrackAndSatellite();
      }
    }
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.shown = !this.shown;
    this.wuService.toggleTyphoonTrackGroupVisibility();
    this.wuService.toggleWeatherSatelliteVisibility();

    const selectedType = this.wuService.getSelectedRainfallContourType();
    if (this.shown) {
      this.wuService.triggerZoomToTyphoon();
    }

    // If on typhoon track page
    if (this.router.url === '/weather-updates/typhoon-track') {
      if (this.shown) {
        this.wuService.setRainfallContourOpacity(0, selectedType);
      } else {
        this.wuService.setRainfallContourOpacity(100, selectedType);
      }
    }

    // If on rainfall contour page
    if (this.router.url === '/weather-updates/rainfall-contour') {
      if (this.shown) {
        this.wuService.setRainfallContourOpacity(0, selectedType);
      } else {
        this.wuService.setRainfallContourOpacity(100, selectedType);
      }
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
