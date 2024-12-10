import { Component, HostListener, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
@Component({
  selector: 'noah-know-your-hazards',
  templateUrl: './know-your-hazards.component.html',
  styleUrls: ['./know-your-hazards.component.scss'],
})
export class KnowYourHazardsComponent implements OnInit {
  sideBarMobile: boolean = true;
  desktopView: boolean = false;
  btnShowSideBar: boolean = false;
  constructor(private kyhService: KyhService, private title: Title) {}

  legendHideSide: boolean = false;
  btnHideSide: boolean = false;
  btnLegend: boolean = true;
  minimizeLegendSide: boolean = false;

  ngOnInit(): void {
    this.title.setTitle('NOAH - Know Your Hazards');
    this.kyhService.init();
    this.kyhService.setCurrentView('all');
    this.updateSideBarState();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.updateSideBarState();
  }

  hideSideBar() {
    this.sideBarMobile = false;
    this.btnShowSideBar = true;
    this.btnHideSide = true;
  }

  showSideBarMobile() {
    this.sideBarMobile = true;
    this.btnShowSideBar = false;
    this.btnHideSide = false;
  }

  openLegendHideSide() {
    this.legendHideSide = true;
    this.minimizeLegendSide = true;
    this.btnLegend = false;
  }

  hideLegendSide() {
    this.legendHideSide = false;
    this.btnHideSide = true;
    this.minimizeLegendSide = false;
    this.btnLegend = true;
  }
  private updateSideBarState() {
    this.desktopView = window.innerWidth < 768 ? false : true;
  }
}
