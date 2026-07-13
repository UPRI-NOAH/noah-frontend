import {
  LAGUNA_DEFAULT_CENTER,
  PH_DEFAULT_CENTER,
  QC_DEFAULT_CENTER,
} from '@features/noah-playground/store/noah-playground.store';
import { NOAH_STUDIO_TOUR } from '@features/noah-playground/tour/noah-studio-tour.config';

import { MapPlaygroundComponent } from './map-playground.component';

describe('MapPlaygroundComponent tour camera reset', () => {
  let component: MapPlaygroundComponent;
  let map: jasmine.SpyObj<any>;
  let playgroundService: jasmine.SpyObj<any>;

  beforeEach(() => {
    map = jasmine.createSpyObj('Map', ['jumpTo']);
    playgroundService = jasmine.createSpyObj('NoahPlaygroundService', [
      'resetPlayground',
    ]);
    component = new MapPlaygroundComponent(
      {} as any,
      playgroundService,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    component.map = map;
    localStorage.removeItem('loginStatus');
  });

  afterEach(() => {
    localStorage.removeItem('loginStatus');
  });

  it('configures Explore a Location to reset the camera on Next', () => {
    const exploreLocationStep = NOAH_STUDIO_TOUR.sections
      .flatMap((section) => section.steps)
      .find((step) => step.id === 'explore-location');

    expect(exploreLocationStep?.nextEvent).toBe('noah-tour-map-camera-reset');
  });

  [
    {
      label: 'standard users',
      loginStatus: null,
      center: PH_DEFAULT_CENTER,
      zoom: 5.5,
    },
    {
      label: 'QC users',
      loginStatus: '1',
      center: QC_DEFAULT_CENTER,
      zoom: 12,
    },
    {
      label: 'Laguna users',
      loginStatus: '2',
      center: LAGUNA_DEFAULT_CENTER,
      zoom: 12.74,
    },
  ].forEach(({ label, loginStatus, center, zoom }) => {
    it(`restores the default camera for ${label}`, () => {
      if (loginStatus) {
        localStorage.setItem('loginStatus', loginStatus);
      }

      component.resetMapCameraForNoahStudioTour();

      expect(map.jumpTo).toHaveBeenCalledOnceWith({
        center,
        zoom,
        bearing: 0,
        pitch: 0,
      });
    });
  });

  it('removes the location pin without clearing other playground state', () => {
    const centerMarker = jasmine.createSpyObj('Marker', ['remove']);
    const draw = jasmine.createSpyObj('MapboxDraw', ['deleteAll']);
    component.centerMarker = centerMarker;
    component.draw = draw;

    component.resetMapCameraForNoahStudioTour();

    expect(playgroundService.resetPlayground).not.toHaveBeenCalled();
    expect(centerMarker.remove).toHaveBeenCalledTimes(1);
    expect(component.centerMarker).toBeNull();
    expect(draw.deleteAll).not.toHaveBeenCalled();
  });

  it('shows measurement results again after the tour reset hides them', () => {
    const answer = document.createElement('div');
    answer.id = 'area';
    answer.style.display = 'none';
    document.body.appendChild(answer);
    component.draw = {
      getAll: () => ({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [120, 14],
                [121, 14],
              ],
            },
          },
        ],
      }),
    };

    (component as any).updateCalculate(null);

    expect(answer.style.display).toBe('block');
    expect(answer.textContent).toContain('Total Distance:');
    answer.remove();
  });
});
