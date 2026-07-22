import { WEATHER_UPDATES_TOUR } from './weather-updates-tour.config';

describe('WEATHER_UPDATES_TOUR', () => {
  it('starts with the Weather Updates welcome step', () => {
    expect(WEATHER_UPDATES_TOUR.id).toBe('weather-updates');
    expect(WEATHER_UPDATES_TOUR.welcome.accentTitle).toBe(
      'Weather\u00a0Updates'
    );
    expect(WEATHER_UPDATES_TOUR.welcome.imageUrl).toBe(
      'assets/images/tour/weather-welcome-image.svg'
    );
    expect(WEATHER_UPDATES_TOUR.sections).toEqual(
      jasmine.arrayContaining([
        jasmine.objectContaining({
          id: 'welcome',
          label: 'Welcome',
          steps: [
            jasmine.objectContaining({
              id: 'welcome',
              title: 'Welcome!',
              placement: 'center',
            }),
          ],
        }),
      ])
    );
  });

  it('matches the KYH and NOAH Studio map navigation steps', () => {
    const mapNavigation = WEATHER_UPDATES_TOUR.sections.find(
      (section) => section.id === 'map-navigation'
    );

    expect(mapNavigation?.steps).toEqual(
      jasmine.arrayContaining([
        jasmine.objectContaining({
          id: 'pan-around-map',
          title: 'Pan Around the Map',
          target: '[data-tour-id="map-canvas"]',
          dimTargets: ['#sidebar'],
          placement: 'bottom-right',
        }),
        jasmine.objectContaining({
          id: 'rotate-and-tilt-view',
          title: 'Rotate and Tilt View',
          target: '[data-tour-id="map-canvas"]',
          dimTargets: ['#sidebar'],
          placement: 'bottom-right',
        }),
      ])
    );
    expect(mapNavigation?.steps[0].text).toContain('**For mobile:**');
    expect(mapNavigation?.steps[1].text).toContain('**For mobile:**');
  });

  it('matches the NOAH Studio search and explore-location flow', () => {
    const mapNavigation = WEATHER_UPDATES_TOUR.sections.find(
      (section) => section.id === 'map-navigation'
    );
    const searchStep = mapNavigation?.steps.find(
      (step) => step.id === 'search-bar'
    );
    const exploreLocationStep = mapNavigation?.steps.find(
      (step) => step.id === 'explore-location'
    );

    expect(WEATHER_UPDATES_TOUR.startEvent).toBe('weather-updates-reset');
    expect(searchStep).toEqual(
      jasmine.objectContaining({
        target: '[data-tour-id="location-search"]',
        spotlightTargets: ['[data-tour-id="location-search-options"]'],
        advanceOnEvent: 'noah-tour-location-selected',
        nextEvent: 'noah-tour-location-search-skipped',
        placement: 'left',
      })
    );
    expect(exploreLocationStep).toEqual(
      jasmine.objectContaining({
        target: '[data-tour-id="map-canvas"]',
        dimTargets: ['#sidebar'],
        nextEvent: 'noah-tour-map-camera-reset',
        placement: 'bottom-right',
      })
    );
  });

  it('uses the NOAH Studio flow for the five Weather Updates map controls', () => {
    const mapControls = WEATHER_UPDATES_TOUR.sections.find(
      (section) => section.id === 'map-controls'
    );

    expect(mapControls?.steps.map((step) => step.id)).toEqual([
      'map-controls-1',
      'map-controls-2',
      'map-controls-3',
      'map-controls-4',
      'map-controls-5',
    ]);
    expect(
      mapControls?.steps.every((step) => step.mobilePanelTarget === '#sidebar')
    ).toBe(true);
    expect(mapControls?.steps[0]).toEqual(
      jasmine.objectContaining({
        target: '[data-tour-id="mapbox-map-controls"]',
        spotlightTargets: ['[data-tour-id="map-view"]'],
        interactionTargets: ['[data-tour-id="map-canvas"]'],
      })
    );
    expect(mapControls?.steps[4]).toEqual(
      jasmine.objectContaining({
        target: '[data-tour-id="map-view"]',
        panelAvoidTargets: ['[data-tour-id="map-view-options"]'],
        nextEvent: 'weather-updates-rainfall-panel-reset',
      })
    );
  });

  it('highlights only the rainfall choices in the Rainfall Panel section', () => {
    const rainfallPanel = WEATHER_UPDATES_TOUR.sections.find(
      (section) => section.id === 'rainfall-panel'
    );

    expect(rainfallPanel?.label).toBe('Rainfall Panel');
    expect(rainfallPanel?.steps).toEqual([
      jasmine.objectContaining({
        id: 'rainfall-panel',
        title: 'Rainfall Panel',
        target: '[data-tour-id="rainfall-panel-options"]',
        spotlightTargets: [
          '[data-tour-id="rainfall-panel-heading"]',
          '[data-tour-id="rainfall-panel-options"]',
        ],
        placement: 'left',
      }),
    ]);
    expect(
      rainfallPanel?.steps.some((step) => step.id === 'rainfall-legend-opacity')
    ).toBe(false);
    expect(rainfallPanel?.steps[0].mobilePanelTarget).toBeUndefined();
  });
});
