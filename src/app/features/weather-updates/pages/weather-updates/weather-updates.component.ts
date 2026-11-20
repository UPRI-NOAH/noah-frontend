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

/**
 * The gap between the map attribution and whatever covers the bottom of the
 * map.
 */
const ATTRIBUTION_GAP = 10;

/**
 * The room the button that opens the sidebar takes at the bottom of the
 * screen.
 */
const MENU_BUTTON_SPACE = 40;

@Component({
  standalone: false,
  selector: 'noah-weather-updates',
  templateUrl: './weather-updates.component.html',
  styleUrls: ['./weather-updates.component.scss'],
})
export class WeatherUpdatesComponent implements OnInit, AfterViewChecked {
  sideBarMobile: boolean = true;
  desktopView: boolean = false;
  btnShowSideBar: boolean = false;

  /** The sidebar panel that covers the bottom of the map on a phone. */
  @ViewChild('panel') panel?: ElementRef<HTMLElement>;

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
   * know where it is before the template has shown it again.
   */
  private panelCoveredHeight: number | null = null;

  constructor(
    private title: Title,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.title.setTitle('NOAH - Weather Updates');
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

  ngAfterViewChecked(): void {
    if (!this.panelPositionDirty) {
      return;
    }

    this.panelPositionDirty = false;
    this.measurePanel();

    // The credits are placed from a measurement taken after this view was
    // checked, so check it once more for the new offset to reach the map.
    this.changeDetector.detectChanges();
  }

  /**
   * Measures how much of the map the sidebar panel covers.
   *
   * The measurement is taken against the bottom of the map rather than the
   * viewport: the browser chrome of a phone can shrink the visible viewport
   * (and `window.innerHeight` with it) while the map keeps the height of the
   * page, so the two numbers drift apart.
   */
  private measurePanel(): void {
    const panel = this.panel?.nativeElement;

    if (
      this.desktopView ||
      !this.sideBarMobile ||
      !panel ||
      panel.offsetParent === null
    ) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const mapBottom =
      panel.parentElement?.getBoundingClientRect().bottom ?? rect.bottom;

    this.panelCoveredHeight = Math.round(mapBottom - rect.top);
  }

  private updateSideBarState() {
    this.desktopView = window.innerWidth < 768 ? false : true;
  }

  /**
   * How high the shared map attribution has to sit on this page.
   *
   * On a phone the sidebar panel covers the bottom of the map, so the
   * credits move above it. When the panel is hidden, the button that opens
   * it is at the bottom of the screen instead.
   */
  get attributionBottomOffset(): number | null {
    if (this.desktopView) {
      return null;
    }

    if (this.sideBarMobile && this.panelCoveredHeight !== null) {
      return this.panelCoveredHeight + ATTRIBUTION_GAP;
    }

    return MENU_BUTTON_SPACE + ATTRIBUTION_GAP;
  }
}
