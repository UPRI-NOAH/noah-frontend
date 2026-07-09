export type TourPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface TourWelcomeContent {
  title: string;
  accentTitle?: string;
  text: string;
  prompt?: string;
  brandLabel?: string;
  logoUrl?: string;
  logoAlt?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface TourStep {
  id: string;
  title: string;
  text: string;
  target?: string;
  placement?: TourPlacement;
}

export interface TourSection {
  id: string;
  label: string;
  steps: TourStep[];
}

export interface TourDefinition {
  id: string;
  title: string;
  welcome: TourWelcomeContent;
  sections: TourSection[];
}

export interface FlatTourStep {
  sectionId: string;
  step: TourStep;
}
