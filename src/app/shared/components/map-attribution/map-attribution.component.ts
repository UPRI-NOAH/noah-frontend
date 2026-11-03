import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import mapboxgl from 'mapbox-gl';

/**
 * A single credit in the map attribution.
 */
export interface MapAttributionCredit {
  /** The text the reader sees, for instance `© Mapbox`. */
  label: string;
  /** Where the credit leads. Credits without a link are shown as plain text. */
  href?: string;
  /** The tooltip and the accessible name of the credit. */
  title?: string;
}

/**
 * The credits every NOAH map has to show, whatever basemap it loads and
 * whatever data it draws on top.
 *
 * They are declared once, here, so the three map pages (NOAH Studio, Know Your
 * Hazards and Weather Updates) cannot drift apart and so a credit is never
 * shown twice.
 */
export const NOAH_MAP_CREDITS: readonly MapAttributionCredit[] = [
  {
    label: '© Mapbox',
    href: 'https://www.mapbox.com/about/maps/',
    title: 'Mapbox',
  },
  {
    label: '© OpenStreetMap',
    href: 'https://www.openstreetmap.org/about/',
    title: 'OpenStreetMap',
  },
  {
    label: '© Department of Health',
    href: 'https://doh.gov.ph/',
    title: 'Department of Health',
  },
];

/**
 * The Mapbox feedback link.
 *
 * It always comes last and always uses the NOAH link, even when a tileset
 * offers a link of its own.
 */
export const MAPBOX_FEEDBACK_CREDIT: MapAttributionCredit = {
  label: 'Improve this map',
  href: 'https://www.mapbox.com/map-feedback/',
  title: 'Improve this map',
};

/**
 * The CSS variables the component publishes so the overlays that share the
 * bottom-right corner of the map (the scale bar) can sit clear of it.
 */
const HEIGHT_VARIABLE = '--noah-map-attribution-height';
const BOTTOM_VARIABLE = '--noah-map-attribution-bottom';
const MAX_WIDTH_VARIABLE = '--noah-map-attribution-max-width';

/**
 * The distance between the credits and the bottom edge of the map, used
 * when a page does not ask for another position.
 */
const DEFAULT_BOTTOM_OFFSET = 10;

/**
 * The room the Mapbox logo takes in the bottom-left corner of the map.
 *
 * The credits keep that room free, so they never hide the logo. Pages that
 * show a logo of their own leave room for it as well.
 */
const LOGO_SPACE = 94;

/** The gap between the credits and the Mapbox logo. */
const LOGO_GAP = 10;

/** The gap between the credits and the right edge of the map. */
const RIGHT_GAP = 10;

/**
 * The width below which the credits collapse into a round button.
 *
 * It is the same width the rest of the app calls a phone: the `md` breakpoint
 * of Tailwind, which is where the pages hide their desktop chrome.
 */
const NARROW_WIDTH = 768;

/**
 * The media query that tells whether the map is narrow enough for the credits
 * to collapse.
 */
const NARROW_QUERY = `(max-width: ${NARROW_WIDTH}px)`;

/**
 * Tells whether the screen is narrow enough for the credits to collapse.
 *
 * The answer is read before the first render, so the credits are already
 * collapsed when the map appears on a phone.
 */
function isNarrowScreen(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }

  return window.matchMedia(NARROW_QUERY).matches;
}

/**
 * Normalises a label so two spellings of the same credit compare equal.
 *
 * The `©` symbol, the case and the punctuation carry no meaning here.
 */
function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * True when two labels name the same credit.
 *
 * A label that contains the other one names the same credit too: Mapbox
 * serves `© Mapbox © OpenStreetMap` as a single attribution, which would
 * otherwise be shown next to the `© Mapbox` credit NOAH already shows.
 */
function isSameCredit(a: string, b: string): boolean {
  const na = normalizeLabel(a);
  const nb = normalizeLabel(b);

  if (!na || !nb) {
    return false;
  }

  return na === nb || na.includes(nb) || nb.includes(na);
}

/**
 * Splits a credit into the parts it is made of.
 *
 * `© Mapbox © OpenStreetMap` is two credits rather than one, so a provider
 * that is not credited yet still shows up on its own.
 */
function splitCreditParts(label: string): string[] {
  return label
    .split(/(?=©)|,\s*(?=©)/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * The name of a credit without its `©` symbol, used as the tooltip of a link
 * whose own title is missing.
 */
function friendlyName(label: string): string {
  return label.replace(/©/g, '').trim() || label;
}

/**
 * Merges credit lists into one, dropping the credits that are already there.
 *
 * The first list wins: the shared NOAH credits come first, so a tileset that
 * repeats `© Mapbox` does not add a second Mapbox credit.
 */
function mergeCredits(
  groups: MapAttributionCredit[][]
): MapAttributionCredit[] {
  const merged: MapAttributionCredit[] = [];
  const claimed: string[] = [];

  for (const group of groups) {
    for (const credit of group) {
      const label = (credit.label ?? '').trim();

      if (!label) {
        continue;
      }

      const parts = splitCreditParts(label);
      const fresh = parts.filter(
        (part) => !claimed.some((claim) => isSameCredit(claim, part))
      );

      if (!fresh.length) {
        // The whole credit is already shown.
        continue;
      }

      if (fresh.length === parts.length) {
        merged.push({ ...credit, label });
      } else {
        // Part of the credit is already shown. Only the new part is kept, and
        // without the link, which belongs to the credit shown first.
        for (const part of fresh) {
          merged.push({ label: part });
        }
      }

      for (const part of fresh) {
        claimed.push(part);
      }
    }
  }

  return merged;
}

/**
 * The map attribution shared by the three NOAH maps.
 *
 * The component shows the credits every NOAH map owes — Mapbox,
 * OpenStreetMap and the Department of Health — plus the credits the loaded
 * style and its data sources ask for, plus the Mapbox feedback link.
 *
 * It replaces the three hand-written attribution blocks the pages used to
 * carry and the native Mapbox attribution control, so there is exactly one
 * attribution on a map and it always looks the same.
 *
 * The component anchors itself to the map it is given: it moves its host
 * element into the map container, which puts the credits in the bottom-right
 * corner of the map itself, whatever the page around the map looks like.
 */
@Component({
  standalone: false,
  selector: 'noah-map-attribution',
  templateUrl: './map-attribution.component.html',
  styleUrls: ['./map-attribution.component.scss'],
})
export class MapAttributionComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  /**
   * The map the credits belong to.
   *
   * Bound late (the map is created in `ngAfterViewInit`), so the listeners
   * are attached from {@link ngOnChanges} rather than in the constructor.
   */
  @Input() map: mapboxgl.Map | null = null;

  /** Extra credits a page wants to show next to the shared ones. */
  @Input() extraCredits: MapAttributionCredit[] = [];

  /** Whether the Mapbox feedback link is shown. */
  @Input() showFeedbackLink = true;

  /**
   * How far above the bottom edge of the map the credits sit, in pixels.
   *
   * `null` keeps the default gap. A page raises the credits when something
   * covers the bottom of the map, so the credits stay readable.
   */
  @Input() bottomOffset: number | null = null;

  /**
   * The width the credits may take, in pixels.
   *
   * `null` keeps the default, which leaves room for the Mapbox logo in the
   * bottom-left corner of the map. A page narrows the credits when a
   * sidebar covers the map.
   */
  @Input() maxWidth: number | null = null;

  /** The credits to render, in the order they are shown. */
  credits: MapAttributionCredit[] = [];

  /**
   * Whether the map is narrow enough for the credits to collapse.
   *
   * On a phone the credits take up too much room, so they collapse behind a
   * round button, the way the native Mapbox attribution control collapses on
   * a narrow screen.
   */
  isNarrow = isNarrowScreen();

  /**
   * Whether the credits are spread out.
   *
   * Only the round button on a phone changes this; on a wider screen the
   * credits are always shown.
   */
  expanded = false;

  /** The attributions the last render was built from, to skip empty updates. */
  private signature: string | null = null;

  /** Watches the credits so their height never goes stale. */
  private resizeObserver: ResizeObserver | null = null;

  /** Tells whether the map is narrow enough for the credits to collapse. */
  private narrowQuery: MediaQueryList | null = null;

  /** Mapbox fires this whenever the style or a source may bring new credits. */
  private readonly mapDataHandler = () => this.refreshCredits();

  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.attachToMap();
    this.publishHeight();
    this.observeSize();
    this.watchWidth();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['map']) {
      // The map instance is replaced whenever the page re-creates it, so the
      // listeners are detached before new ones are attached.
      this.detachMapListeners();
      this.attachToMap();

      const map = this.map;

      if (map) {
        // The map fires these events for every tile it loads, so they are
        // listened to outside of Angular: the view is only updated when the
        // credits really changed.
        this.zone.runOutsideAngular(() => {
          map.on('styledata', this.mapDataHandler);
          map.on('sourcedata', this.mapDataHandler);
        });
      }

      this.refreshCredits();
    }

    if (changes['extraCredits'] || changes['showFeedbackLink']) {
      this.refreshCredits();
    }

    if (changes['bottomOffset']) {
      this.publishBottomOffset();
    }

    if (changes['maxWidth']) {
      this.publishMaxWidth();
    }
  }

  ngOnDestroy(): void {
    this.detachMapListeners();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.narrowQuery?.removeEventListener('change', this.narrowHandler);
    this.narrowQuery = null;

    const container = this.map?.getContainer?.();

    container?.style.removeProperty(HEIGHT_VARIABLE);
    container?.style.removeProperty(BOTTOM_VARIABLE);
    container?.style.removeProperty(MAX_WIDTH_VARIABLE);
  }

  /**
   * Shows or hides the credits.
   *
   * Only the round button on a phone does this; on a wider screen the
   * credits are always shown.
   */
  toggle(): void {
    this.expanded = !this.expanded;
  }

  /**
   * Watches how wide the screen is, so the credits collapse again when the
   * phone is turned and the map becomes narrow once more.
   */
  private watchWidth(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    this.narrowQuery = window.matchMedia(NARROW_QUERY);

    this.zone.runOutsideAngular(() => {
      this.narrowQuery?.addEventListener('change', this.narrowHandler);
    });
  }

  /**
   * Collapses the credits whenever the screen becomes narrow or wide again.
   *
   * The native Mapbox attribution control does the same: the credits are
   * collapsed on a narrow screen, and they collapse again when the screen is
   * rotated and the map becomes narrow once more.
   */
  private readonly narrowHandler = (event: MediaQueryListEvent) => {
    this.zone.run(() => {
      this.isNarrow = event.matches;
      this.expanded = false;
    });
  };

  /**
   * Moves the host element into the map container.
   *
   * The credits belong to the map, not to the page around it: anchoring them
   * to the map container keeps them in the bottom-right corner of the map on
   * every page, whatever the page puts around it.
   */
  private attachToMap(): void {
    const host = this.elementRef.nativeElement;
    const container = this.map?.getContainer?.();

    if (!container) {
      host.classList.remove('is-attached');
      return;
    }

    if (host.parentElement !== container) {
      container.appendChild(host);
    }

    host.classList.add('is-attached');

    // The map may have been replaced, so the values the overlays read are
    // published again on the new container.
    this.publishBottomOffset();
    this.publishMaxWidth();
    this.publishHeight();
  }

  /**
   * Publishes where the credits sit, so the overlays that share the
   * bottom-right corner of the map follow them.
   */
  private publishBottomOffset(): void {
    const container = this.map?.getContainer?.();

    if (!container) {
      return;
    }

    container.style.setProperty(
      BOTTOM_VARIABLE,
      `${this.bottomOffset ?? DEFAULT_BOTTOM_OFFSET}px`
    );
  }

  /**
   * Publishes how wide the credits may be.
   *
   * They leave room for the Mapbox logo, which sits in the bottom-left
   * corner of the map, so they never hide it. A page narrows them further
   * when something else covers the map.
   */
  private publishMaxWidth(): void {
    const container = this.map?.getContainer?.();

    if (!container) {
      return;
    }

    const free = `calc(100% - ${LOGO_SPACE + LOGO_GAP + RIGHT_GAP}px)`;

    container.style.setProperty(
      MAX_WIDTH_VARIABLE,
      this.maxWidth === null || this.maxWidth === undefined
        ? free
        : `min(${this.maxWidth}px, ${free})`
    );
  }

  /** Removes the listeners attached to the previous map instance. */
  private detachMapListeners(): void {
    const map = this.map;

    if (!map) {
      return;
    }

    map.off('styledata', this.mapDataHandler);
    map.off('sourcedata', this.mapDataHandler);
  }

  /**
   * Rebuilds the credits when the map asks for it.
   *
   * The map fires `styledata` and `sourcedata` for every tile it loads, so
   * the attributions are collected first and the view is only updated when
   * they actually changed.
   */
  private refreshCredits(): void {
    const attributions = this.collectAttributions();
    const signature = attributions.join('||');

    if (signature === this.signature) {
      return;
    }

    this.signature = signature;
    const credits = this.buildCredits(attributions);

    this.zone.run(() => {
      this.credits = credits;
    });
  }

  /**
   * The attributions the loaded style and its data sources ask for.
   *
   * This is what the native Mapbox attribution control does: it reads the
   * attribution of every source cache the style uses.
   */
  private collectAttributions(): string[] {
    const map = this.map;

    if (!map || !map.style) {
      return [];
    }

    const attributions: string[] = [];

    try {
      for (const cache of map.style.getSourceCaches()) {
        if (!cache || !cache.used) {
          continue;
        }

        const attribution = cache.getSource()?.attribution;

        if (attribution && !attributions.includes(attribution)) {
          attributions.push(attribution);
        }
      }
    } catch {
      // A style that is still loading has no source caches yet.
      return attributions;
    }

    return attributions;
  }

  /**
   * Builds the list of credits to show.
   *
   * The shared NOAH credits come first, then the credits of the page, then
   * the credits of the style and its data sources. The Mapbox feedback link
   * is always last.
   */
  private buildCredits(attributions: string[]): MapAttributionCredit[] {
    const styleCredits: MapAttributionCredit[] = [];

    for (const attribution of attributions) {
      styleCredits.push(...this.parseAttribution(attribution));
    }

    const credits = mergeCredits([
      [...NOAH_MAP_CREDITS],
      this.extraCredits ?? [],
      styleCredits,
    ]);

    if (this.showFeedbackLink) {
      const feedbackIndex = credits.findIndex((credit) =>
        isSameCredit(credit.label, MAPBOX_FEEDBACK_CREDIT.label)
      );

      // The feedback link of a tileset is replaced by the NOAH one, which
      // always comes last.
      if (feedbackIndex >= 0) {
        credits.splice(feedbackIndex, 1);
      }

      credits.push(MAPBOX_FEEDBACK_CREDIT);
    }

    return credits;
  }

  /**
   * Reads the credits out of an attribution string.
   *
   * Mapbox serves them as HTML: every link is a credit of its own, and the
   * text around them is split on the `©` symbol.
   */
  private parseAttribution(html: string): MapAttributionCredit[] {
    const credits: MapAttributionCredit[] = [];
    const document = new DOMParser().parseFromString(html, 'text/html');

    for (const node of Array.from(document.body.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const part of splitCreditParts(node.textContent ?? '')) {
          credits.push({ label: part, title: friendlyName(part) });
        }
        continue;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }

      const element = node as HTMLElement;

      if (element.tagName === 'A') {
        const label = (element.textContent ?? '').trim();

        if (!label) {
          continue;
        }

        credits.push({
          label,
          href: element.getAttribute('href') ?? undefined,
          title: element.getAttribute('title')?.trim() || friendlyName(label),
        });
        continue;
      }

      // Anything else, an image logo for instance, keeps its text.
      for (const part of splitCreditParts(element.textContent ?? '')) {
        credits.push({ label: part, title: friendlyName(part) });
      }
    }

    return credits;
  }

  /**
   * Publishes how tall the credits are.
   *
   * The scale bar shares the bottom-right corner of the map, so it needs to
   * know how much room the credits take.
   */
  private publishHeight(): void {
    const height = this.elementRef.nativeElement.offsetHeight;
    const container = this.map?.getContainer?.();

    if (height > 0 && container) {
      container.style.setProperty(HEIGHT_VARIABLE, `${height}px`);
    }
  }

  /**
   * Keeps the published height in sync with the credits.
   *
   * The credits wrap onto a second line on a narrow map, which makes the bar
   * taller and the scale bar move up.
   */
  private observeSize(): void {
    const host = this.elementRef.nativeElement;

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.publishHeight());
      this.resizeObserver.observe(host);
    });
  }
}
