import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';

/**
 * The gap between the map attribution and whatever covers the bottom of the
 * map.
 */
const ATTRIBUTION_GAP = 10;

/**
 * The room the buttons at the bottom of the screen take when the sidebar
 * panel is hidden: the "legend" button and the margin below it.
 */
const LEGEND_BUTTON_SPACE = 68;

@Component({
  standalone: false,
  selector: 'noah-know-your-hazards',
  templateUrl: './know-your-hazards.component.html',
  styleUrls: ['./know-your-hazards.component.scss'],
})
export class KnowYourHazardsComponent implements OnInit {
  sideBarMobile: boolean = true;
  desktopView: boolean = false;
  btnShowSideBar: boolean = false;

  /** The sidebar panel that covers the bottom of the map on a phone. */
  @ViewChild('mobilePanel') mobilePanel?: ElementRef<HTMLElement>;

  /** The hazard legend that hangs above the sidebar panel on a phone. */
  @ViewChild('legendPanel') legendPanel?: ElementRef<HTMLElement>;

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
    this.updateSideBarState();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.updateSideBarState();
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

  /**
   * How high the shared map attribution has to sit on this page.
   *
   * On a phone the sidebar panel covers the bottom of the map, and the
   * hazard legend hangs above it, so the credits move above both. When the
   * panel is hidden, the buttons that open the panel and the legend are at
   * the bottom of the screen instead.
   */
  get attributionBottomOffset(): number | null {
    if (this.desktopView) {
      return null;
    }

    const legend = this.legendPanel?.nativeElement;
    const panel = this.mobilePanel?.nativeElement;

    if (this.sideBarMobile && legend) {
      const top = legend.getBoundingClientRect().top;

      return Math.round(window.innerHeight - top) + ATTRIBUTION_GAP;
    }

    if (this.sideBarMobile && panel) {
      const top = panel.getBoundingClientRect().top;

      return Math.round(window.innerHeight - top) + ATTRIBUTION_GAP;
    }

    return LEGEND_BUTTON_SPACE + ATTRIBUTION_GAP;
  }
}
