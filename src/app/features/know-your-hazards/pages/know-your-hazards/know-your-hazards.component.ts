import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
@Component({
  selector: 'noah-know-your-hazards',
  templateUrl: './know-your-hazards.component.html',
  styleUrls: ['./know-your-hazards.component.scss'],
})
export class KnowYourHazardsComponent implements OnInit {
  sideBarMobile: boolean = true;
  btnShowSideBar: boolean = false;
  constructor(private kyhService: KyhService, private title: Title) {}

  kyhLegend: boolean = true;
  btnLegend: boolean = false;
  legendHideSide: boolean = false;
  btnHideSide: boolean = false;
  minimizeLegendSide: boolean = false;

  ngOnInit(): void {
    this.title.setTitle('NOAH - Know Your Hazards');
    this.kyhService.init();
    this.kyhService.setCurrentView('all');
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
}
