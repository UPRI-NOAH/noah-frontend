import { HazardLevel } from '@features/noah-playground/store/noah-playground.store';
import { HazardType } from '@features/personalized-risk-assessment/store/pra.store';

// FLOOD
export const FLOOD_5RRP = {
  id: 'flood-return-period-5' as HazardLevel,
  name: '5-Year Return Period',
};

export const FLOOD_25RRP = {
  id: 'flood-return-period-25' as HazardLevel,
  name: '25-Year Return Period',
};

export const FLOOD_100RRP = {
  id: 'flood-return-period-100' as HazardLevel,
  name: '100-Year Return Period',
};

// LANDSLIDE
export const LANDSLIDE = {
  id: 'landslide-hazard' as HazardLevel,
  name: 'Landslides',
};

// export const ALLUVIAL_FAN = {
//   id: 'alluvial-fan-hazard' as HazardLevel,
//   name: 'Alluvial Fan'
// };

export const DEBRIS_FLOW = {
  id: 'debris-flow' as HazardLevel,
  name: 'Debris Flow and Alluvial Fan',
};

export const UNSTABLE_SLOPES = {
  id: 'unstable-slopes-maps' as HazardLevel,
  name: 'Unstable Slopes',
};

// STORM SURGE
export const SSA1 = {
  id: 'storm-surge-advisory-1' as HazardLevel,
  name: 'Storm Surge Advisory 1',
};

export const SSA2 = {
  id: 'storm-surge-advisory-2' as HazardLevel,
  name: 'Storm Surge Advisory 2',
};

export const SSA3 = {
  id: 'storm-surge-advisory-3' as HazardLevel,
  name: 'Storm Surge Advisory 3',
};

export const SSA4 = {
  id: 'storm-surge-advisory-4' as HazardLevel,
  name: 'Storm Surge Advisory 4',
};

// COLLATED LEVELS
export const FLOOD_HAZARD_LEVELS = [FLOOD_5RRP, FLOOD_25RRP, FLOOD_100RRP];
export const LANDSLIDE_HAZARD_TYPES = [
  LANDSLIDE,
  // ALLUVIAL_FAN,
  DEBRIS_FLOW,
  UNSTABLE_SLOPES,
];
export const STORM_SURGE_HAZARD_LEVELS = [SSA1, SSA2, SSA3, SSA4];

export const HAZARDS = [
  {
    name: 'Flood Hazard',
    type: 'flood' as HazardType,
    levels: FLOOD_HAZARD_LEVELS,
  },
  {
    name: 'Landslide Hazard',
    type: 'landslide' as HazardType,
    levels: LANDSLIDE_HAZARD_TYPES,
  },
  {
    name: 'Storm Surge Hazard',
    type: 'storm-surge' as HazardType,
    levels: STORM_SURGE_HAZARD_LEVELS,
  },
];
