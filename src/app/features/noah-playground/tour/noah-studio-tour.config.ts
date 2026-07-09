import { TourDefinition } from '@shared/components/tour/tour.models';

export const NOAH_STUDIO_TOUR: TourDefinition = {
  id: 'noah-studio',
  title: 'NOAH Studio',
  welcome: {
    title: 'Welcome to',
    accentTitle: 'NOAH Studio',
    text: 'Explore hazard maps, weather data, and disaster risk information for the Philippines.',
    prompt: 'Take a quick tour to get started, or explore on your own.',
    brandLabel: 'STUDIO',
    logoUrl: 'assets/icons/logo-noah.svg',
    logoAlt: 'Project NOAH',
    imageUrl: 'assets/images/tour/noah-studio-welcome-image.svg',
    imageAlt: 'NOAH Studio map preview',
  },
  sections: [
    {
      id: 'location',
      label: 'Location',
      steps: [
        {
          id: 'search-location',
          title: 'Search for a location',
          text: 'Find a place to center the map and begin exploring available information for that area.',
          target: '[data-tour-id="location-search"]',
          placement: 'right',
        },
      ],
    },
    {
      id: 'hazards',
      label: 'Hazards',
      steps: [
        {
          id: 'explore-hazards',
          title: 'Explore hazard layers',
          text: 'Turn hazard layers on or off and adjust the available settings for the selected hazard.',
          target: '[data-tour-id="hazard-layers"]',
          placement: 'right',
        },
      ],
    },
    {
      id: 'weather',
      label: 'Weather',
      steps: [
        {
          id: 'view-weather',
          title: 'View weather updates',
          text: 'Open weather layers to review satellite, typhoon, and temperature information.',
          target: '[data-tour-id="weather-updates"]',
          placement: 'right',
        },
      ],
    },
    {
      id: 'risk',
      label: 'Risk',
      steps: [
        {
          id: 'assess-risk',
          title: 'Assess risk',
          text: 'Use the risk assessment tools to combine hazard and exposure information for your selected area.',
          target: '[data-tour-id="risk-assessment"]',
          placement: 'right',
        },
      ],
    },
    {
      id: 'map',
      label: 'Map',
      steps: [
        {
          id: 'change-map-view',
          title: 'Change the map view',
          text: 'Switch between terrain and satellite views using the map control.',
          target: '[data-tour-id="map-style"]',
          placement: 'left',
        },
      ],
    },
  ],
};
