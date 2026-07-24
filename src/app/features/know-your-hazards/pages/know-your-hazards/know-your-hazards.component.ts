import { Component, HostListener, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
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
  constructor(
    private kyhService: KyhService,
    private title: Title,
    private router: Router
  ) {}

  kyhLegend: boolean = true;
  btnLegend: boolean = false;
  legendHideSide: boolean = false;
  btnHideSide: boolean = false;
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

  @HostListener('window:know-your-hazards-reset')
  resetForKnowYourHazardsTour(): void {
    void this.router.navigateByUrl('/know-your-hazards').then(() => {
      document
        .querySelectorAll<HTMLElement>('[data-tour-id="kyh-sidebar-scroll"]')
        .forEach((sidebar) => sidebar.scrollTo({ top: 0 }));
    });
    this.kyhService.setCurrentView('all');

    this.sideBarMobile = true;
    this.btnShowSideBar = false;
    this.kyhLegend = true;
    this.btnLegend = false;
    this.legendHideSide = false;
    this.btnHideSide = false;
    this.minimizeLegendSide = false;
    this.updateSideBarState();
  }

  @HostListener('window:know-your-hazards-overview-reset')
  showHazardsOverviewForTour(): void {
    void this.router.navigateByUrl('/know-your-hazards');
    this.kyhService.setCurrentView('all');
  }

  @HostListener('window:know-your-hazards-critical-facilities-show')
  showCriticalFacilitiesForTour(): void {
    this.kyhService.setCurrentView('all');
    void this.router.navigateByUrl('/know-your-hazards').then(() => {
      window.dispatchEvent(
        new Event('know-your-hazards-critical-facilities-ready')
      );
    });
  }

  hideSideBar() {
    this.sideBarMobile = false;
    this.btnShowSideBar = true;
    this.kyhLegend = false;
    this.btnLegend = true;
    this.btnHideSide = true;
  }

  showSideBarMobile() {
    this.sideBarMobile = true;
    this.btnShowSideBar = false;

    this.kyhLegend = true;
    this.btnLegend = false;

    this.legendHideSide = false;
    this.minimizeLegendSide = false;
    this.btnHideSide = false;
  }

  openLegend() {
    this.btnLegend = !this.btnLegend;
    this.kyhLegend = !this.kyhLegend;
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
