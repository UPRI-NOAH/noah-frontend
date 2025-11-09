import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
import { Observable } from 'rxjs';
import { SwiperComponent } from 'swiper/angular';
import Swiper, { SwiperOptions } from 'swiper';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'noah-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
})
export class BaseComponent implements OnInit {
  currentLocation$: Observable<string>;

  @ViewChild('swiperRef', { static: false }) swiper?: SwiperComponent;

  config: SwiperOptions = {
    slidesPerView: 1,
  };
  constructor(
    private wuService: WeatherUpdatesService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.currentLocation$ = this.wuService.currentLocation$;
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

  ngAfterViewInit() {
    if (this.swiper?.swiperRef) {
      // 🔹 Handle swipe events → update URL
      this.swiper.swiperRef.on('slideChange', () => {
        const activeIndex = this.swiper?.swiperRef.activeIndex ?? 0;
        this.ngZone.run(() => {
          if (activeIndex === 0) {
            this.router.navigateByUrl('/weather-updates/rainfall-contour');
          } else if (activeIndex === 1) {
            this.router.navigateByUrl('/weather-updates/typhoon-track');
          }
        });
      });

      // 🔹 Handle URL change → update swiper index
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          if (!this.swiper?.swiperRef) return;

          this.ngZone.runOutsideAngular(() => {
            if (event.url.includes('/weather-updates/typhoon-track')) {
              this.swiper?.swiperRef.slideTo(1);
            } else if (
              event.url.includes('/weather-updates/rainfall-contour')
            ) {
              this.swiper?.swiperRef.slideTo(0);
            }
          });
        });
    }
  }

  slideNext() {
    this.swiper?.swiperRef.slideNext();
  }

  slidePrev() {
    this.swiper?.swiperRef.slidePrev();
  }
}
