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

  boundLegend: boolean = true;
  btnLegend: boolean = false;
  legendHideSide: boolean = false;
  btnHideSide: boolean = false;
  minimizeLegendSide: boolean = false;

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
    this.boundLegend = false;
    this.btnLegend = true;
    this.btnHideSide = true;
  }

  showSideBarMobile() {
    this.sideBarMobile = true;
    this.btnShowSideBar = false;

    this.boundLegend = true;
    this.btnLegend = false;

    this.legendHideSide = false;
    this.minimizeLegendSide = false;
    this.btnHideSide = false;
  }

  openLegend() {
    this.btnLegend = !this.btnLegend;
    this.boundLegend = !this.boundLegend;
  }

  openLegendHideSide() {
    this.legendHideSide = true;
    this.minimizeLegendSide = true;
    this.btnHideSide = false;
  }

  hideLegendSide() {
    this.legendHideSide = false;
    this.btnHideSide = true;
    this.minimizeLegendSide = false;
  }

  private updateSideBarState() {
    this.desktopView = window.innerWidth < 768 ? false : true;
  }
}
