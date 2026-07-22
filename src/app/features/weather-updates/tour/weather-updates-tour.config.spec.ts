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
    expect(WEATHER_UPDATES_TOUR.sections).toEqual([
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
    ]);
  });
});
