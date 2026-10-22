import {
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
export class WeatherUpdatesComponent implements OnInit {
  sideBarMobile: boolean = true;
  desktopView: boolean = false;
  btnShowSideBar: boolean = false;

  /** The sidebar panel that covers the bottom of the map on a phone. */
  @ViewChild('panel') panel?: ElementRef<HTMLElement>;

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

    const panel = this.panel?.nativeElement;

    if (this.sideBarMobile && panel) {
      const top = panel.getBoundingClientRect().top;

      return Math.round(window.innerHeight - top) + ATTRIBUTION_GAP;
    }

    return MENU_BUTTON_SPACE + ATTRIBUTION_GAP;
  }
}
