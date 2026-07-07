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

  private suppressRouteOnNextSlideChange = false;
  private temperatureShown = false;

  constructor(
    private wuService: WeatherUpdatesService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.currentLocation$ = this.wuService.currentLocation$;
    this.wuService.temperatureShown$.subscribe((shown) => {
      this.temperatureShown = shown;
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

  ngAfterViewInit() {
    if (!this.swiper) return;
    const swiperRef = this.swiper.swiperRef;
    if (!swiperRef) return;

    // Ensure swiper is initialized
    const handleSlideChange = () => {
      if (this.suppressRouteOnNextSlideChange) {
        this.suppressRouteOnNextSlideChange = false;
        return;
      }

      const activeIndex = swiperRef.activeIndex ?? 0;
      this.ngZone.run(() => {
        if (activeIndex === 0) {
          const url = this.temperatureShown
            ? '/weather-updates/temperature'
            : '/weather-updates/rainfall-contour';
          this.router.navigateByUrl(url);
        } else if (activeIndex === 1) {
          this.router.navigateByUrl('/weather-updates/typhoon-track');
        }
      });
    };

    //Listen for slide changes
    swiperRef.on('slideChange', handleSlideChange);

    // Function to safely move swiper based on URL
    const updateSwiperFromUrl = (url: string) => {
      if (!swiperRef || swiperRef.destroyed) return;

      this.ngZone.runOutsideAngular(() => {
        if (url.includes('/weather-updates/typhoon-track')) {
          this.suppressRouteOnNextSlideChange = true;
          swiperRef.slideTo(1);
        } else if (
          url.includes('/weather-updates/rainfall-contour') ||
          url.includes('/weather-updates/temperature')
        ) {
          // Temperature UI is shown within the rainfall slide on mobile.
          this.suppressRouteOnNextSlideChange = true;
          swiperRef.slideTo(0);
        }
      });
    };

    // Wait for initialization before first slideTo
    // Swiper does not have 'initialized', use 'destroyed' (false when initialized)
    if (swiperRef.destroyed) {
      swiperRef.on('init', () => {
        updateSwiperFromUrl(this.router.url);
      });
      swiperRef.init(); // manually init if not already
    } else {
      updateSwiperFromUrl(this.router.url);
    }

    // Handle URL changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        updateSwiperFromUrl(event.url);
      });

    const updateRouterFromUrl = (url: string) => {
      if (url.includes('/weather-updates/temperature')) {
        this.suppressRouteOnNextSlideChange = true;
        swiperRef.slideTo(0);
        this.router.navigateByUrl('/weather-updates/temperature', {
          skipLocationChange: false,
        });
      }
    };
  }

  slideNext() {
    this.swiper?.swiperRef.slideNext();
  }

  slidePrev() {
    this.swiper?.swiperRef.slidePrev();
  }
}
