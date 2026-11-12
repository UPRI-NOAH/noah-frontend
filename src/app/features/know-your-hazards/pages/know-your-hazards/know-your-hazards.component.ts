import {
  AfterViewChecked,
  ChangeDetectorRef,
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
 * panel is hidden: the button that opens the panel and the margin below it.
 */
const LEGEND_BUTTON_SPACE = 68;

@Component({
  standalone: false,
  selector: 'noah-know-your-hazards',
  templateUrl: './know-your-hazards.component.html',
  styleUrls: ['./know-your-hazards.component.scss'],
})
export class KnowYourHazardsComponent implements OnInit, AfterViewChecked {
  sideBarMobile: boolean = true;
  desktopView: boolean = false;
  btnShowSideBar: boolean = false;

  /** The sidebar panel that covers the bottom of the map on a phone. */
  @ViewChild('mobilePanel') mobilePanel?: ElementRef<HTMLElement>;

  /**
   * Set when the position of the sidebar panel has to be measured again.
   */
  private panelPositionDirty = true;

  /**
   * The part of the map the sidebar panel covers, in pixels from the bottom of
   * the map.
   *
   * The last measurement is kept: the panel is pinned to the bottom of the
   * screen, so hiding and showing it does not move it, and the credits must
   * know where it is before the template has re-created it.
   */
  private panelCoveredHeight: number | null = null;

  constructor(
    private kyhService: KyhService,
    private title: Title,
    private elementRef: ElementRef<HTMLElement>,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.title.setTitle('NOAH - Know Your Hazards');
    this.kyhService.init();
    this.kyhService.setCurrentView('all');
    this.updateSideBarState();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.updateSideBarState();
    this.panelPositionDirty = true;
  }

  hideSideBar() {
    this.sideBarMobile = false;
    this.btnShowSideBar = true;
    this.panelPositionDirty = true;
  }

  showSideBarMobile() {
    this.sideBarMobile = true;
    this.btnShowSideBar = false;
    this.panelPositionDirty = true;
  }

  /**
   * Publishes where the sidebar panel sits so that the map overlays can
   * follow it.
   *
   * The panel is a sheet whose size comes from the stylesheet, so it is
   * measured here instead of being hard-coded. The hazard legend of the map
   * moves to the left of the panel, with its bottom edge level with the map
   * credits that sit above the panel.
   */
  private publishPanelPosition(): void {
    const host = this.elementRef.nativeElement;
    const panel = this.mobilePanel?.nativeElement;

    // The panel is off screen on wide screens and whenever the user closes
    // it, and then the legend keeps its place at the bottom of the map.
    if (!this.sideBarMobile || !panel || panel.offsetParent === null) {
      host.style.removeProperty('--noah-kyh-panel-left');
      host.style.removeProperty('--noah-kyh-legend-bottom');
      return;
    }

    const rect = panel.getBoundingClientRect();
    // The overlays are positioned against the bottom of the map, not against
    // the viewport: the browser chrome of a phone can shrink the visible
    // viewport (and `window.innerHeight` with it) while the map keeps the
    // height of the page, so the two numbers drift apart.
    const mapBottom =
      panel.parentElement?.getBoundingClientRect().bottom ?? rect.bottom;
    this.panelCoveredHeight = Math.round(mapBottom - rect.top);

    host.style.setProperty(
      '--noah-kyh-panel-left',
      `${Math.round(rect.left)}px`
    );
    host.style.setProperty(
      '--noah-kyh-legend-bottom',
      `${this.panelCoveredHeight + ATTRIBUTION_GAP}px`
    );
  }

  ngAfterViewChecked(): void {
    if (!this.panelPositionDirty) {
      return;
    }

    this.panelPositionDirty = false;
    this.publishPanelPosition();

    // The credits are placed from a measurement taken after this view was
    // checked, so check it once more for the new offset to reach the map.
    this.changeDetector.detectChanges();
  }

  private updateSideBarState() {
    this.desktopView = window.innerWidth < 768 ? false : true;
  }

  /**
   * How high the shared map attribution has to sit on this page.
   *
   * On a phone the sidebar panel covers the bottom of the map, so the
   * credits move above it. When the panel is hidden, the button that opens
   * the panel is at the bottom of the screen instead.
   */
  get attributionBottomOffset(): number | null {
    if (this.desktopView) {
      return null;
    }

    if (this.sideBarMobile && this.panelCoveredHeight !== null) {
      return this.panelCoveredHeight + ATTRIBUTION_GAP;
    }

    return LEGEND_BUTTON_SPACE + ATTRIBUTION_GAP;
  }
}
