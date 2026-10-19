import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MapService } from '@core/services/map.service';
import {
  Basemap,
  BASEMAP_PRESETS,
  DEFAULT_BASEMAP,
  getBasemapForPhilippineTime,
} from '@core/services/standard-style';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Basemap lighting control for Mapbox Standard styles: a Day / Auto toggle plus
 * the Dawn / Day / Dusk / Night presets.
 *
 * Shared by every map page (playground, weather updates, know your hazards) so
 * the control cannot drift between them. The selected preset itself is held by
 * {@link MapService}, which means it is app-wide: changing it here re-lights
 * every map currently registered with the service, and the buttons stay in sync
 * through `mapService.basemap$`.
 *
 * The host is expected to be positioned by the parent (see
 * `.basemap-preset-control` in each map's stylesheet), because the comfortable
 * spot differs per map: it always sits just above the map's own scale bar.
 * Hide it while a legacy (non-Standard) basemap is loaded with
 * `[class.is-hidden]`, which keeps this component alive so the Auto state
 * survives a basemap switch.
 */
@Component({
  standalone: false,
  selector: 'noah-basemap-preset-control',
  templateUrl: './basemap-preset-control.component.html',
  styleUrls: ['./basemap-preset-control.component.scss'],
})
export class BasemapPresetControlComponent implements OnDestroy, OnInit {
  /** Lighting presets offered when a Mapbox Standard basemap is active. */
  readonly basemapPresets = BASEMAP_PRESETS;

  /** The currently applied lighting preset. */
  currentBasemap: Basemap = DEFAULT_BASEMAP;

  /**
   * When `false` (the default) the basemap is driven manually: it is pinned to
   * {@link DEFAULT_BASEMAP} (`day`), the Philippine clock is not consulted, and
   * the preset buttons are hidden.
   *
   * When `true` the basemap follows Philippine time and the Dawn / Day / Dusk /
   * Night buttons are shown so the user can still pick a preset manually.
   */
  isAutoBasemap = false;

  /**
   * Kept apart from {@link currentBasemap} so a manual preset click is not
   * immediately overwritten by the schedule: the clock only switches when the
   * Philippine-Time window changes.
   */
  private scheduledBasemap: Basemap | null = null;

  /**
   * Interval id for the realtime basemap clock. Created outside Angular so it
   * cannot trigger change detection on every tick.
   */
  private basemapClockTimer: number | null = null;

  private _unsub = new Subject();

  constructor(private mapService: MapService, private zone: NgZone) {}

  ngOnInit(): void {
    // Keep the preset buttons in sync with the shared selection.
    this.mapService.basemap$
      .pipe(takeUntil(this._unsub))
      .subscribe((basemap) => {
        this.currentBasemap = basemap;
      });

    // Lighting starts in manual mode: the basemap is pinned to Day and the
    // Philippine clock is not followed until the user flips the toggle to
    // "Auto". See toggleAutoBasemap().
    this.applyManualBasemap();
  }

  ngOnDestroy(): void {
    this.stopRealtimeBasemap();
    this._unsub.next(null);
    this._unsub.complete();
  }

  /**
   * Starts the realtime Philippine-Time basemap cycle.
   *
   * Only used in automatic mode (see {@link toggleAutoBasemap}). The preset is
   * applied immediately (so a 3 AM visit opens on `night`, not the manual `day`
   * default) and then re-checked every minute so a long-lived tab crosses each
   * boundary without a reload. A manual preset click still works: the schedule
   * acts only when the Philippine-Time window changes, so the user's choice
   * survives until the next dawn / day / dusk / night boundary.
   */
  private startRealtimeBasemap(): void {
    this.stopRealtimeBasemap();
    this.applyRealtimeBasemap();

    this.zone.runOutsideAngular(() => {
      this.basemapClockTimer = window.setInterval(() => {
        this.applyRealtimeBasemap();
      }, 60_000);
    });
  }

  /**
   * Switches the basemap when the Philippine-Time window has changed.
   *
   * Only a window transition triggers a switch, which is what lets a manual
   * selection stand between boundaries.
   */
  private applyRealtimeBasemap(): void {
    const scheduled = getBasemapForPhilippineTime();

    if (scheduled === this.scheduledBasemap) {
      return;
    }

    this.scheduledBasemap = scheduled;
    this.zone.run(() => this.mapService.switchBasemap(scheduled));
  }

  /** Cancels the realtime basemap clock, if one is running. */
  private stopRealtimeBasemap(): void {
    if (this.basemapClockTimer === null) {
      return;
    }

    window.clearInterval(this.basemapClockTimer);
    this.basemapClockTimer = null;
  }

  /**
   * Pins the basemap to the manual default (`day`).
   *
   * Called on init and whenever the toggle is flipped back to "Day".
   */
  private applyManualBasemap(): void {
    this.stopRealtimeBasemap();
    this.scheduledBasemap = null;
    this.mapService.switchBasemap(DEFAULT_BASEMAP);
  }

  /**
   * Flips between manual (Day, presets hidden) and automatic Philippine-Time
   * lighting (presets shown).
   */
  toggleAutoBasemap(): void {
    this.isAutoBasemap = !this.isAutoBasemap;

    if (this.isAutoBasemap) {
      this.startRealtimeBasemap();
    } else {
      this.applyManualBasemap();
    }
  }

  /**
   * Applies a Mapbox Standard lighting preset. Only meaningful while the
   * Standard basemap is loaded; the buttons that call this are hidden
   * otherwise.
   */
  switchBasemap(preset: Basemap): void {
    this.mapService.switchBasemap(preset);
  }
}
