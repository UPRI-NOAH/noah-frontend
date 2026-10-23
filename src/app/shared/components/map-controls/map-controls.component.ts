import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MapService } from '@core/services/map.service';
import {
  Basemap,
  BASEMAP_PRESETS,
  getBasemapLabel,
  LightingSelection,
} from '@core/services/standard-style';
import { MapStyle } from '@features/know-your-hazards/store/kyh.store';

interface StyleOption {
  value: MapStyle;
  label: string;
  /**
   * The screenshot that shows what the style looks like.
   *
   * They are real screenshots of the three basemaps, so the user recognises
   * the style they are about to load.
   */
  preview: string;
  /**
   * Whether the style is new.
   *
   * The newest styles get a badge on their card, so the user can see at a
   * glance what the panel has just added.
   */
  isNew?: boolean;
}

interface LightingOption {
  value: LightingSelection;
  label: string;
}

/** The MapboxDraw modes the toolbar can start. */
type DrawMode = 'draw_polygon' | 'draw_line_string';

/**
 * The NOAH map controls: a floating toolbar on the right edge of the map and
 * a "Map style" + "Lighting" panel in the bottom-right corner.
 *
 * One shared component renders both, so the three map pages (playground,
 * weather updates, know your hazards) cannot drift apart. Everything is
 * optional: the toolbar only shows the actions a given map can perform (the
 * drawing actions need a MapboxDraw instance, the locate action needs the
 * geolocate control), and the panel works with or without a map.
 *
 * The component deliberately does not own any Mapbox state:
 *
 * - the basemap style is an `@Input` / `@Output` pair, so the map page keeps
 *   ownership of `switchMapStyle()` (which is where the style URL, the camera
 *   restore and the analytics live),
 * - the lighting selection lives in {@link MapService}, which is where the
 *   Philippine-Time schedule is implemented.
 */
@Component({
  standalone: false,
  selector: 'noah-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrls: ['./map-controls.component.scss'],
})
export class MapControlsComponent
  implements AfterViewInit, OnChanges, OnInit, OnDestroy
{
  /** The toolbar, measured so the overlays below it can follow it. */
  @ViewChild('toolbar') toolbarRef?: ElementRef<HTMLElement>;

  /**
   * The map the controls act on.
   *
   * Bound late (the map is created in `ngAfterViewInit`), so every listener
   * is attached from {@link ngOnChanges} rather than in the constructor.
   */
  @Input() map: mapboxgl.Map | null = null;

  /** The basemap style currently loaded. */
  @Input() selectedStyle: MapStyle = 'standard';

  /** Emits the basemap style the user picked. */
  @Output() selectedStyleChange = new EventEmitter<MapStyle>();

  /**
   * The MapboxDraw instance of the map, when it has one.
   *
   * The drawing actions are hidden without it, so maps that cannot measure
   * (weather updates, know your hazards) do not show dead buttons.
   */
  @Input() draw: any = null;

  /** The geolocate control of the map, when it has one. */
  @Input() geolocateControl: mapboxgl.GeolocateControl | null = null;

  /**
   * The basemap styles offered by the panel.
   *
   * The values are the `MapStyle` values the map pages already switch on; the
   * labels and previews describe what the user actually sees.
   */
  readonly styleOptions: StyleOption[] = [
    {
      value: 'terrain',
      label: 'Streets',
      preview: 'assets/images/streets-thumb.jpg',
    },
    {
      value: 'satellite',
      label: 'Satellite',
      preview: 'assets/images/satellite-thumb.jpg',
    },
    {
      value: 'standard',
      label: 'Standard',
      preview: 'assets/images/standard-thumb.jpg',
      isNew: true,
    },
  ];

  /** The lighting options offered by the panel: `Auto` plus the presets. */
  readonly lightingOptions: LightingOption[] = [
    { value: 'auto', label: 'Auto' },
    ...BASEMAP_PRESETS.map(({ value, label }) => ({ value, label })),
  ];

  /** The lighting selection in effect (`auto` or a manual preset). */
  lightingSelection: LightingSelection = 'auto';

  /** The preset the Philippine clock currently points at. */
  scheduledBasemap: Basemap = 'day';

  /** The current map bearing, used to spin the compass needle. */
  bearing = 0;

  /** Whether the style / lighting panel is expanded. */
  panelOpen = false;

  /** The MapboxDraw mode currently active, if any. */
  activeDrawMode: DrawMode | null = null;

  private _unsub = new Subject<void>();

  /** Watches the toolbar so its published height never goes stale. */
  private toolbarResizeObserver: ResizeObserver | null = null;

  private readonly rotateHandler = () => {
    if (this.map) {
      this.bearing = this.map.getBearing();
    }
  };

  private readonly modeHandler = (event: any) => {
    const mode = event?.mode;
    this.activeDrawMode =
      mode === 'draw_polygon' || mode === 'draw_line_string' ? mode : null;
  };

  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    this.mapService.lightingSelection$
      .pipe(takeUntil(this._unsub))
      .subscribe((selection) => (this.lightingSelection = selection));

    this.mapService.scheduledBasemap$
      .pipe(takeUntil(this._unsub))
      .subscribe((basemap) => (this.scheduledBasemap = basemap));
  }

  ngAfterViewInit(): void {
    this.publishToolbarGeometry();
    this.observeToolbar();
  }

  /**
   * Republishes the toolbar geometry whenever the toolbar itself changes.
   *
   * The toolbar grows as the map offers more actions (the drawing buttons
   * only appear once the map has a drawing instance), which happens after the
   * first measurement.
   */
  private observeToolbar(): void {
    const element = this.toolbarRef?.nativeElement;

    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.toolbarResizeObserver = new ResizeObserver(() =>
      this.publishToolbarGeometry()
    );
    this.toolbarResizeObserver.observe(element);
  }

  /**
   * Keeps the published toolbar geometry in sync with the viewport.
   *
   * The toolbar shrinks a little on phones and grows when a map offers more
   * actions, so the overlays that stack below it (the scale bar, the
   * coordinate readout) have to be told where it ends again.
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    this.publishToolbarGeometry();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['map']) {
      return;
    }

    // The map instance is replaced whenever the page re-creates it, so the
    // listeners are detached before new ones are attached.
    this.detachMapListeners();

    if (this.map) {
      this.bearing = this.map.getBearing();
      this.map.on('rotate', this.rotateHandler);
      this.map.on('draw.modechange', this.modeHandler);
    }
  }

  ngOnDestroy(): void {
    this.detachMapListeners();
    this.toolbarResizeObserver?.disconnect();
    this.toolbarResizeObserver = null;
    this._unsub.next();
    this._unsub.complete();
    document.documentElement.style.removeProperty(
      '--noah-map-controls-toolbar-top'
    );
    document.documentElement.style.removeProperty(
      '--noah-map-controls-toolbar-height'
    );
  }

  /**
   * Publishes where the toolbar starts and how tall it is.
   *
   * The scale bar and the coordinate readout live in the same right-hand
   * column as the toolbar, on the map canvas rather than inside this
   * component. Two CSS variables let them follow the toolbar instead of
   * hard-coding pixel offsets that break as soon as the toolbar changes size
   * (a different set of actions per map, smaller buttons on phones).
   */
  private publishToolbarGeometry(): void {
    const root = document.documentElement;
    const isPhone = window.innerWidth <= 768;

    root.style.setProperty(
      '--noah-map-controls-toolbar-top',
      isPhone ? '58px' : '10px'
    );

    const height = this.toolbarRef?.nativeElement?.offsetHeight ?? 0;
    if (height > 0) {
      root.style.setProperty(
        '--noah-map-controls-toolbar-height',
        `${height}px`
      );
    }
  }

  /** Removes the listeners attached to the previous map instance. */
  private detachMapListeners(): void {
    if (!this.map) {
      return;
    }

    this.map.off('rotate', this.rotateHandler);
    this.map.off('draw.modechange', this.modeHandler);
  }

  /** Zooms the map in one level. */
  zoomIn(): void {
    this.map?.zoomIn();
  }

  /** Zooms the map out one level. */
  zoomOut(): void {
    this.map?.zoomOut();
  }

  /** Turns the map back to north (and to a flat, top-down view). */
  resetNorth(): void {
    this.map?.resetNorthPitch({ duration: 400 });
  }

  /** Centres the map on the user's location. */
  locateUser(): void {
    this.geolocateControl?.trigger();
  }

  /** Expands or collapses the style / lighting panel. */
  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
  }

  /** Asks the map page to load the picked basemap style. */
  selectStyle(style: MapStyle): void {
    if (style === this.selectedStyle) {
      return;
    }

    this.selectedStyleChange.emit(style);
  }

  /** Applies the picked lighting mode. */
  selectLighting(selection: LightingSelection): void {
    this.mapService.setLighting(selection);
  }

  /**
   * Starts (or cancels) a drawing action.
   *
   * The same button that starts a mode cancels it again, so the toolbar never
   * leaves the map in a mode the user cannot see.
   */
  toggleDraw(mode: DrawMode): void {
    if (!this.draw) {
      return;
    }

    if (this.activeDrawMode === mode) {
      this.draw.changeMode('simple_select');
      this.activeDrawMode = null;
      return;
    }

    this.draw.changeMode(mode);
    this.activeDrawMode = mode;
  }

  /** Removes every measured shape from the map. */
  clearDrawings(): void {
    if (!this.draw) {
      return;
    }

    this.draw.deleteAll();
    this.draw.changeMode('simple_select');
    this.activeDrawMode = null;

    const areaEl = document.getElementById('area');
    const distanceEl = document.getElementById('distance');
    if (areaEl) {
      areaEl.innerHTML = '';
    }
    if (distanceEl) {
      distanceEl.innerHTML = '';
    }
  }

  /**
   * True when the loaded basemap supports the Mapbox Standard lighting
   * presets.
   *
   * Only the Standard style exposes a configurable `basemap` import, so the
   * legacy terrain / satellite styles keep whatever lighting they define.
   */
  get lightingEnabled(): boolean {
    return this.selectedStyle === 'standard';
  }

  /** The status line shown next to the "Lighting" title. */
  get lightingStatus(): string {
    if (!this.lightingEnabled) {
      return 'Select the Light basemap';
    }

    if (this.lightingSelection === 'auto') {
      return `Follows local time · ${getBasemapLabel(
        this.scheduledBasemap
      )} now`;
    }

    return `Manual · ${getBasemapLabel(this.lightingSelection)}`;
  }
}
