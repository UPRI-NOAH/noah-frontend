import { TourDefinition } from '@shared/components/tour/tour.models';

export const WEATHER_UPDATES_TOUR: TourDefinition = {
  id: 'weather-updates',
  title: 'Weather Updates',
  welcome: {
    title: 'Welcome to',
    accentTitle: 'Weather\u00a0Updates',
    text: 'Monitor current weather conditions, rainfall forecasts, and related map overlays across the Philippines.',
    prompt:
      'Take a quick tour to get started, or skip and explore on your own.  If you skip the tour, you can return to it anytime using the Help button on the Map.',
    brandLabel: 'WEATHER UPDATES',
    logoUrl: 'assets/icons/logo-noah.svg',
    logoAlt: 'Project NOAH',
    imageUrl: 'assets/images/tour/weather-welcome-image.svg',
    imageAlt: 'Weather Updates map preview',
  },
  sections: [
    {
      id: 'welcome',
      label: 'Welcome',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome!',
          text: 'This is the beginning of the Weather Updates tutorial. This walkthrough will guide you through searching for a location, viewing rainfall forecasts, switching between forecast intervals, reading the rainfall legend, adjusting map opacity, and exploring additional weather options such as typhoon tracks.',
          placement: 'center',
        },
      ],
    },
  ],
};
