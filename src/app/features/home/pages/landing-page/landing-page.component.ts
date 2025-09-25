import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { QcSensorService } from '@features/noah-playground/services/qc-sensor.service';
@Component({
  selector: 'noah-landing-page',
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent implements OnInit {
  searchTerm: string;
  isDropdownOpen = false;
  currentSlide = 0;
  totalSlides = 2;
  private slideInterval: any;

  constructor(
    private kyhService: KyhService,
    private router: Router,
    private title: Title,
    private qcSensorService: QcSensorService
  ) {}

  ngOnInit(): void {
    this.title.setTitle('NOAH - Nationwide Operational Assessment of Hazards');
    this.startAutoSlide();
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

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  startAutoSlide(): void {
    this.slideInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    }, 5000); // 5 seconds
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  gotoTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
}
