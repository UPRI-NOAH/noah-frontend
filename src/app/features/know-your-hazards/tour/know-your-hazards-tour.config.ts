import { TourDefinition } from '@shared/components/tour/tour.models';

export const KNOW_YOUR_HAZARDS_TOUR: TourDefinition = {
  id: 'know-your-hazards',
  title: 'Know Your Hazards',
  welcome: {
    title: 'Welcome to',
    accentTitle: 'Know\u00a0Your\u00a0Hazards',
    text: 'Discover the potential hazards in your area and find critical facilities nearby.',
    prompt: 'Take a quick tour to get started, or explore on your own.',
    brandLabel: 'KNOW YOUR HAZARDS',
    logoUrl: 'assets/icons/logo-noah.svg',
    logoAlt: 'Project NOAH',
    imageUrl: 'assets/images/tour/kyh-welcome-image.svg',
    imageAlt: 'Know Your Hazards map preview',
  },
  sections: [
    {
      id: 'welcome',
      label: 'Welcome',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome!',
          text: 'This tour will show you how to explore the hazards in your area, navigate the map, and find critical facilities nearby.',
          placement: 'center',
        },
      ],
    },
  ],
};
