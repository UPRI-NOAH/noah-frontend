export type TourPlacement =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'upper-left'
  | 'upper-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

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
  /** Primary highlighted and interactive element used to position the panel. */
  target?: string;
  /** Additional elements that are both highlighted and interactive. */
  spotlightTargets?: string[];
  /** Elements that remain interactive without being visually highlighted. */
  interactionTargets?: string[];
  /** Visible elements that the tour panel must not cover. */
  panelAvoidTargets?: string[];
  /** Elements that are explicitly dimmed and blocked. */
  dimTargets?: string[];
  advanceOnEvent?: string;
  nextEvent?: string;
  interactionInsets?: Partial<
    Record<'top' | 'right' | 'bottom' | 'left', number>
  >;
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
  startEvent?: string;
  welcome: TourWelcomeContent;
  sections: TourSection[];
}

export interface FlatTourStep {
  sectionId: string;
  step: TourStep;
}
