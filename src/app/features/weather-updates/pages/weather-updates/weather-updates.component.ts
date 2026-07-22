import { Component, HostListener, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
import { UPRI_DEFAULT_CENTER } from '@features/weather-updates/store/weather-updates.store';
import { take } from 'rxjs/operators';

@Component({
  selector: 'noah-weather-updates',
  templateUrl: './weather-updates.component.html',
  styleUrls: ['./weather-updates.component.scss'],
})
export class WeatherUpdatesComponent implements OnInit {
  sideBarMobile: boolean = true;
  desktopView: boolean = false;
  btnShowSideBar: boolean = false;

  constructor(private title: Title, private wuService: WeatherUpdatesService) {}

  ngOnInit(): void {
    this.title.setTitle('NOAH - Weather Updates');
    this.updateSideBarState();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.updateSideBarState();
  }

  hideSideBar() {
    this.sideBarMobile = false;
    this.btnShowSideBar = true;
  }

  showSideBarMobile() {
    this.sideBarMobile = true;
    this.btnShowSideBar = false;
  }

  @HostListener('window:weather-updates-reset')
  resetForWeatherUpdatesTour(): void {
    this.sideBarMobile = true;
    this.btnShowSideBar = false;
    this.wuService.resetTourLocation();
  }

  @HostListener('window:weather-updates-rainfall-panel-reset')
  showRainfallSidebarForTour(): void {
    this.sideBarMobile = true;
    this.btnShowSideBar = false;
  }

  @HostListener('window:noah-tour-location-search-skipped')
  useTourFallbackLocation(): void {
    this.wuService.center$.pipe(take(1)).subscribe((center) => {
      if (center) {
        return;
      }

      this.wuService.setCurrentLocation('UP Resilience Institute');
      this.wuService.setCenter(UPRI_DEFAULT_CENTER);
      this.wuService.setCurrentCoords(UPRI_DEFAULT_CENTER);
    });
  }

  private updateSideBarState() {
    this.desktopView = window.innerWidth < 768 ? false : true;
  }
}
