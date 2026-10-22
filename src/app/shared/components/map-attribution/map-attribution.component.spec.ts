import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import mapboxgl from 'mapbox-gl';

import {
  MAPBOX_FEEDBACK_CREDIT,
  MapAttributionComponent,
  NOAH_MAP_CREDITS,
} from './map-attribution.component';

/**
 * A map that knows only what the attribution component asks of it: the
 * container it lives in, the sources of the style and the events it fires.
 */
function createMap(attributions: string[] = []) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const listeners: Record<string, (() => void)[]> = {};

  return {
    container,
    setAttributions: (values: string[]) => {
      attributions = values;
    },
    getContainer: () => container,
    style: {
      getSourceCaches: () =>
        attributions.map((attribution) => ({
          used: true,
          getSource: () => ({ attribution }),
        })),
    },
    on: (type: string, handler: () => void) => {
      listeners[type] = [...(listeners[type] ?? []), handler];
    },
    off: (type: string, handler: () => void) => {
      listeners[type] = (listeners[type] ?? []).filter(
        (listener) => listener !== handler
      );
    },
    fire: (type: string) =>
      (listeners[type] ?? []).forEach((listener) => listener()),
  };
}

function asMap(map: unknown): mapboxgl.Map {
  return map as mapboxgl.Map;
}

describe('MapAttributionComponent', () => {
  let component: MapAttributionComponent;
  let fixture: ComponentFixture<MapAttributionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapAttributionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MapAttributionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    document.querySelectorAll('div').forEach((element) => {
      if (!element.id && !element.className) {
        element.remove();
      }
    });
  });

  /** The credits as they are shown, in the order they are shown. */
  function renderedCredits(): {
    label: string;
    href: string | null;
    title: string | null;
    ariaLabel: string | null;
  }[] {
    return fixture.debugElement
      .queryAll(By.css('.map-attribution__credit'))
      .map((credit) => {
        const element = credit.nativeElement as HTMLElement;

        return {
          label: (element.textContent ?? '').trim(),
          href: element.getAttribute('href'),
          title: element.getAttribute('title'),
          ariaLabel: element.getAttribute('aria-label'),
        };
      });
  }

  function setMap(map: unknown): void {
    fixture.componentRef.setInput('map', asMap(map));
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('owes the Mapbox, OpenStreetMap and Department of Health credits', () => {
    expect(NOAH_MAP_CREDITS.map((credit) => credit.label)).toEqual([
      '© Mapbox',
      '© OpenStreetMap',
      '© Department of Health',
    ]);

    expect(NOAH_MAP_CREDITS.map((credit) => credit.href)).toEqual([
      'https://www.mapbox.com/about/maps/',
      'https://www.openstreetmap.org/about/',
      'https://doh.gov.ph/',
    ]);

    expect(NOAH_MAP_CREDITS.map((credit) => credit.title)).toEqual([
      'Mapbox',
      'OpenStreetMap',
      'Department of Health',
    ]);

    expect(MAPBOX_FEEDBACK_CREDIT.label).toBe('Improve this map');
    expect(MAPBOX_FEEDBACK_CREDIT.href).toBe(
      'https://www.mapbox.com/map-feedback/'
    );
  });

  it('shows the shared credits and the feedback link', () => {
    setMap(createMap());

    expect(renderedCredits()).toEqual([
      {
        label: '© Mapbox',
        href: 'https://www.mapbox.com/about/maps/',
        title: 'Mapbox',
        ariaLabel: 'Mapbox',
      },
      {
        label: '© OpenStreetMap',
        href: 'https://www.openstreetmap.org/about/',
        title: 'OpenStreetMap',
        ariaLabel: 'OpenStreetMap',
      },
      {
        label: '© Department of Health',
        href: 'https://doh.gov.ph/',
        title: 'Department of Health',
        ariaLabel: 'Department of Health',
      },
      {
        label: 'Improve this map',
        href: 'https://www.mapbox.com/map-feedback/',
        title: 'Improve this map',
        ariaLabel: 'Improve this map',
      },
    ]);
  });

  it('does not repeat a credit the map already provides', () => {
    setMap(
      createMap([
        '<a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
      ])
    );

    const labels = renderedCredits().map((credit) => credit.label);

    expect(labels).toEqual([
      '© Mapbox',
      '© OpenStreetMap',
      '© Department of Health',
      'Improve this map',
    ]);
  });

  it('keeps one feedback link, the NOAH one, and puts it last', () => {
    setMap(
      createMap([
        '<a class="mapbox-improve-map" href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a>',
      ])
    );

    const credits = renderedCredits();

    expect(
      credits.filter((credit) => credit.label === 'Improve this map')
    ).toEqual([
      {
        label: 'Improve this map',
        href: 'https://www.mapbox.com/map-feedback/',
        title: 'Improve this map',
        ariaLabel: 'Improve this map',
      },
    ]);
    expect(credits[credits.length - 1].label).toBe('Improve this map');
  });

  it('picks up a credit the style brings later', () => {
    const map = createMap();

    setMap(map);

    expect(
      renderedCredits().some((credit) => credit.label.includes('PAGASA'))
    ).toBeFalse();

    map.setAttributions([
      '<a href="https://www.pagasa.dost.gov.ph/" target="_blank">© PAGASA</a>',
    ]);
    map.fire('styledata');
    fixture.detectChanges();

    const credits = renderedCredits();

    expect(credits.map((credit) => credit.label)).toContain('© PAGASA');
    expect(credits[credits.length - 1].label).toBe('Improve this map');
  });

  it('shows the credits a page asks for', () => {
    fixture.componentRef.setInput('extraCredits', [
      { label: '© PAGASA', href: 'https://www.pagasa.dost.gov.ph/' },
    ]);
    setMap(createMap());

    const labels = renderedCredits().map((credit) => credit.label);

    expect(labels).toContain('© PAGASA');
    expect(labels[labels.length - 1]).toBe('Improve this map');
  });

  it('leaves out the feedback link when the page does not want it', () => {
    fixture.componentRef.setInput('showFeedbackLink', false);
    setMap(createMap());

    const labels = renderedCredits().map((credit) => credit.label);

    expect(labels).not.toContain('Improve this map');
    expect(labels.length).toBe(3);
  });

  it('moves the credits into the container of the map', () => {
    const map = createMap();

    setMap(map);

    const host = fixture.nativeElement as HTMLElement;

    expect(map.container.contains(host)).toBeTrue();
    expect(host.classList.contains('is-attached')).toBeTrue();
  });

  it('follows the map when it is replaced', () => {
    const first = createMap();
    const second = createMap();

    setMap(first);
    setMap(second);

    const host = fixture.nativeElement as HTMLElement;

    expect(second.container.contains(host)).toBeTrue();
    expect(first.container.contains(host)).toBeFalse();
  });

  it('publishes where the credits sit, so the scale bar follows', () => {
    const map = createMap();

    setMap(map);

    expect(
      map.container.style.getPropertyValue('--noah-map-attribution-bottom')
    ).toBe('10px');

    fixture.componentRef.setInput('bottomOffset', 120);
    fixture.detectChanges();

    expect(
      map.container.style.getPropertyValue('--noah-map-attribution-bottom')
    ).toBe('120px');
  });

  it('publishes the width the credits may take', () => {
    const map = createMap();

    setMap(map);

    expect(
      map.container.style.getPropertyValue('--noah-map-attribution-max-width')
    ).toBe('calc(100% - 114px)');

    fixture.componentRef.setInput('maxWidth', 300);
    fixture.detectChanges();

    expect(
      map.container.style.getPropertyValue('--noah-map-attribution-max-width')
    ).toBe('min(300px, calc(100% - 114px))');
  });

  it('cleans up after itself when it is destroyed', () => {
    const map = createMap();

    setMap(map);

    fixture.destroy();

    expect(
      map.container.style.getPropertyValue('--noah-map-attribution-bottom')
    ).toBe('');
    expect(
      map.container.style.getPropertyValue('--noah-map-attribution-max-width')
    ).toBe('');
  });
});
