import { TourDefinition } from '@shared/components/tour/tour.models';

export const NOAH_STUDIO_TOUR: TourDefinition = {
  id: 'noah-studio',
  title: 'NOAH Studio',
  startEvent: 'noah-studio-playground-reset',
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
      id: 'welcome',
      label: 'Welcome',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome!',
          text: 'This is the beginning of the NOAH Studio tutorial. This walkthrough will guide you through the main tools, navigation, and features you can use to explore hazard maps, weather data, and disaster risk information across the Philippines.',
        },
      ],
    },
    {
      id: 'map-navigation',
      label: 'Map Navigation',
      steps: [
        {
          id: 'pan-around-map',
          title: 'Pan Around the Map',
          text: 'Left-click and drag anywhere on the map to move around and explore different locations.',
          target: '[data-tour-id="map-canvas"]',
          dimTargets: ['#sidebar'],
          placement: 'bottom-right',
        },
        {
          id: 'rotate-and-tilt-view',
          title: 'Rotate and Tilt View',
          text: 'Right-click and drag on the map to rotate your view or tilt the map for a different perspective.',
          target: '[data-tour-id="map-canvas"]',
          dimTargets: ['#sidebar'],
          placement: 'bottom-right',
        },
        {
          id: 'search-bar',
          title: 'Search Bar',
          text: 'Use the Search Location bar to jump to any city, municipality, or barangay in the Philippines. Just type a name, choose from the searched locations, and the map will travel there instantly.',
          target: '[data-tour-id="location-search"]',
          spotlightTargets: ['[data-tour-id="location-search-options"]'],
          advanceOnEvent: 'noah-tour-location-selected',
          nextEvent: 'noah-tour-location-search-skipped',
          placement: 'right',
        },
        {
          id: 'explore-location',
          title: 'Explore a Location',
          text: 'After searching for a location, move the pin to any point on the map to view available hazard, weather, and disaster risk data for that place.',
          target: '[data-tour-id="map-canvas"]',
          dimTargets: ['#sidebar'],
          placement: 'bottom-right',
        },
      ],
    },
    {
      id: 'map-controls',
      label: 'Map Controls',
      steps: [
        {
          id: 'map-controls-1',
          title: 'Map Controls',
          text: 'Use these map controls to adjust how you view and interact with the map. These tools let you change map views, access the tour, and use extra map information.',
          target: '[data-tour-id="map-controls"]',
          spotlightTargets: ['[data-tour-id="mapbox-map-controls"]'],
          dimTargets: ['#sidebar'],
          placement: 'left',
        },
        {
          id: 'map-controls-2',
          title: 'Zoom Controls',
          text: 'Use the plus and minus buttons to zoom in for more detail or zoom out for a wider view.',
          target: '[data-tour-id="mapbox-zoom-in"]',
          spotlightTargets: ['[data-tour-id="mapbox-zoom-out"]'],
          dimTargets: ['#sidebar'],
          placement: 'left',
        },
      ],
    },
  ],
};
