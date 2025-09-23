import { Component, HostListener, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'noah-weather-updates',
  templateUrl: './weather-updates.component.html',
  styleUrls: ['./weather-updates.component.scss'],
})
export class WeatherUpdatesComponent implements OnInit {
  sideBarMobile: boolean = true;
  desktopView: boolean = false;
  btnShowSideBar: boolean = false;

  constructor(private title: Title) {}

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

  private updateSideBarState() {
    this.desktopView = window.innerWidth < 768 ? false : true;
  }
}
