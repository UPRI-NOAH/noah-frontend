import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
@Component({
  selector: 'noah-landing-page',
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent implements OnInit {
  searchTerm: string;
  isDropdownOpen = false;

  constructor(
    private kyhService: KyhService,
    private router: Router,
    private title: Title,
    private wuService: WeatherUpdatesService
  ) {}

  ngOnInit(): void {
    this.title.setTitle('NOAH - Nationwide Operational Assessment of Hazards');
  }

  selectPlace(selectedPlace: any) {
    this.kyhService.setCurrentLocation(
      selectedPlace.text ||
        selectedPlace.place_name ||
        selectedPlace.properties?.name || // display on search results
        selectedPlace.properties?.full_address
    );

    // Handle both Geocoding API (.center) and Searchbox API (.geometry.coordinates)
    const coords = selectedPlace.center || selectedPlace.geometry?.coordinates;

    if (!coords) {
      console.error('No coordinates found in selected place:', selectedPlace);
      return;
    }

    const [lng, lat] = coords;
    this.kyhService.setCenter({ lat, lng });
    this.kyhService.setCurrentCoords({ lat, lng });

    this.router.navigate(['know-your-hazards']);
  }
  noahBrowser() {
    const url = 'https://noah.up.edu.ph/noah-studio';
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/i.test(userAgent);
    const chromeUrl = `googlechrome://noah.up.edu.ph/noah-studio`;

    if (isMobile) {
      if (userAgent.includes('android')) {
        // Open in Chrome using intent:// without navigating away
        window.open(
          'intent://noah.up.edu.ph/noah-studio#Intent;scheme=https;package=com.android.chrome;end',
          '_blank'
        );
      } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        const browserDefault =
          (window.location.href = `x-safari-https://noah.up.edu.ph/noah-studio`);
        if (!browserDefault) {
          window.open(chromeUrl, '_blank');
        }
      }
    } else {
      // Desktop: Open in a new tab without navigating away
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
  gotoTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
  weatherUpdate() {
    //reset rainfall contour opacity to 100 for all types
    ['1hr', '3hr', '6hr', '12hr', '24hr'].forEach((type) => {
      this.wuService.setRainfallContourOpacity(100, type as any);
    });
    //disable typhoon track and weather satellite overlays
    this.wuService.setTyphoonTrackVisibility(false);
    this.wuService.setWeatherSatelliteVisibility(false);
  }

  typhoonTrack() {
    // Automatically enable typhoon track and himawari satellite when navigating from landing page
    const selectedType = this.wuService.getSelectedRainfallContourType();
    this.wuService.setRainfallContourOpacity(0, selectedType);
    this.wuService.enableTyphoonTrackAndSatellite();
  }
}
