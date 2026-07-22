import {
  Component,
  HostListener,
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';
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
    window.dispatchEvent(new Event('noah-tour-location-selected'));
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
          if (this.temperatureShown) {
            this.wuService.activateTemperature();
            this.router.navigateByUrl('/weather-updates/temperature');
          } else {
            this.wuService.activateRainfall();
            this.router.navigateByUrl('/weather-updates/rainfall-contour');
          }
        } else {
          this.wuService.activateTyphoonTrack();
          this.wuService.triggerZoomToTyphoon();

          this.router.navigateByUrl('/weather-updates/typhoon-track');
        }
      });
    };

    //Listen for slide changes
    swiperRef.on('slideChange', handleSlideChange);

    // Function to safely move swiper based on URL
    const updateSwiperFromUrl = (url: string) => {
      if (!swiperRef || swiperRef.destroyed) {
        return;
      }

      this.ngZone.runOutsideAngular(() => {
        let targetIndex = 0;

        if (url.includes('/weather-updates/typhoon-track')) {
          targetIndex = 1;
        } else if (
          url.includes('/weather-updates/rainfall-contour') ||
          url.includes('/weather-updates/temperature')
        ) {
          // Rainfall and Temperature share the first slide on mobile.
          targetIndex = 0;
        } else {
          return;
        }
        // Mobile only: when returning to the Rainfall/Temperature slide,
        // restore the default overlay opacity.
        // if (window.innerWidth < 768 && targetIndex === 0) {
        //   this.ngZone.run(() => {
        //     this.wuService.restoreWeatherOverlays();
        //   });
        // }
        // Only move if the swiper is not already on the correct slide.
        if (swiperRef.activeIndex !== targetIndex) {
          this.suppressRouteOnNextSlideChange = true;
          swiperRef.slideTo(targetIndex);
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
        if (!event.urlAfterRedirects.startsWith('/weather-updates')) {
          return;
        }
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

  slideNext(): void {
    this.swiper?.swiperRef.slideTo(1);

    this.wuService.activateTyphoonTrack();
    this.wuService.triggerZoomToTyphoon();

    this.router.navigateByUrl('/weather-updates/typhoon-track');
  }

  slidePrev(): void {
    this.swiper?.swiperRef.slideTo(0);

    if (this.temperatureShown) {
      this.wuService.activateTemperature();
      this.router.navigateByUrl('/weather-updates/temperature');
    } else {
      this.wuService.activateRainfall();
      this.router.navigateByUrl('/weather-updates/rainfall-contour');
    }
  }

  @HostListener('window:weather-updates-rainfall-panel-reset')
  showRainfallPanelForTour(): void {
    this.wuService.setTyphoonTrackVisibility(false);
    this.wuService.setWeatherSatelliteVisibility(false);
    this.wuService.selectRainfallContourType('1hr');
    this.swiper?.swiperRef.slideTo(0);
    void this.router.navigateByUrl('/weather-updates/rainfall-contour');

    window.requestAnimationFrame(() => {
      document
        .querySelectorAll<HTMLElement>(
          '[data-tour-id="weather-sidebar-scroll"]'
        )
        .forEach((sidebar) => sidebar.scrollTo({ top: 0 }));
    });
  }

  goHome(): void {
    this.wuService.resetWeatherUpdates();
    this.router.navigateByUrl('/');
  }
}
