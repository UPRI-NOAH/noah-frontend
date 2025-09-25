import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
import { Observable } from 'rxjs';
import { SwiperComponent } from 'swiper/angular';
import Swiper from 'swiper';

@Component({
  selector: 'noah-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
})
export class BaseComponent implements OnInit {
  currentLocation$: Observable<string>;
  initialSlide: number | undefined; // start as undefined

  @ViewChild('swiperRef', { static: false }) swiper?: SwiperComponent;

  constructor(
    private wuService: WeatherUpdatesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentLocation$ = this.wuService.currentLocation$;
    this.route.queryParams.subscribe((params) => {
      const slide = Number(params['slide']);
      this.initialSlide = slide === 1 ? 1 : 0;
    });
  }

  selectPlace(selectedPlace) {
    this.wuService.setCurrentLocation(
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
    this.wuService.setCenter({ lat, lng });
    this.wuService.setCurrentCoords({ lat, lng });
  }

  slideNext() {
    this.swiper?.swiperRef.slideNext();
    this.router.navigate(['weather-updates/typhoon-track']);
  }

  slidePrev() {
    this.swiper?.swiperRef.slidePrev();
    this.router.navigate(['weather-updates/rainfall-contour']);
  }

  onSlideChange(swiperComp: SwiperComponent) {
    const swiper: Swiper = swiperComp.swiperRef; // ✅ Correct way
    const activeIndex = swiper.activeIndex;

    if (activeIndex === 0) {
      this.router.navigate(['weather-updates/rainfall-contour']);
    } else if (activeIndex === 1) {
      this.router.navigate(['weather-updates/typhoon-track']);
    }
  }
}
