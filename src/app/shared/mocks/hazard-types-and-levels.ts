import { HazardLevel } from '@features/noah-playground/store/noah-playground.store';
import { HazardType } from '@features/personalized-risk-assessment/store/pra.store';
import FLOOD_5_ALL from '../data/fh_5yr.json';
import FLOOD_25_ALL from '../data/fh_25yr.json';
import FLOOD_100_ALL from '../data/fh_100yr.json';

import LANDSLIDE_ALL from '../data/lh_landslide.json';

import SSA1_ALL from '../data/ssh_ssa1.json';
import SSA2_ALL from '../data/ssh_ssa2.json';
import SSA3_ALL from '../data/ssh_ssa3.json';
import SSA4_ALL from '../data/ssh_ssa4.json';

// FLOOD
export const FLOOD_5RRP = {
  id: 'flood-return-period-5' as HazardLevel,
  name: '5-Year Return Period',
  layers: FLOOD_5_ALL,
};

export const FLOOD_25RRP = {
  id: 'flood-return-period-25' as HazardLevel,
  name: '25-Year Return Period',
  layers: FLOOD_25_ALL,
};

export const FLOOD_100RRP = {
  id: 'flood-return-period-100' as HazardLevel,
  name: '100-Year Return Period',
  layers: FLOOD_100_ALL,
};

// LANDSLIDE
export const LANDSLIDE = {
  id: 'landslide-hazard' as HazardLevel,
  name: 'Landslides',
  layers: LANDSLIDE_ALL,
};

// export const ALLUVIAL_FAN = {
//   id: 'alluvial-fan-hazard' as HazardLevel,
//   name: 'Alluvial Fan',
//   layers: [
//     {
//         id: 'alluvial-fan-hazard' as HazardLevel,
//         sourceLayer: 'Leyte_Merged_AFDF_1-4dfa9e',
//         url: 'mapbox://jadurani.5z50jk2x',
//     }
//   ],
// };

export const DEBRIS_FLOW = {
  id: 'debris-flow' as HazardLevel,
  name: 'Debris Flow',
  layers: [
    {
      id: 'debris-flow' as HazardLevel,
      sourceLayer: 'Leyte_Merged_AFDF_1-4dfa9e',
      url: 'mapbox://jadurani.5z50jk2x',
    },
  ],
};

export const UNSTABLE_SLOPES = {
  id: 'unstable-slopes-maps' as HazardLevel,
  name: 'Unstable Slopes',
  layers: [
    {
      id: 'unstable-slopes-maps' as HazardLevel,
      sourceLayer: 'Leyte_Merged_AFDF_1-4dfa9e',
      url: 'mapbox://jadurani.5z50jk2x',
    },
  ],
};

// STORM SURGE
export const SSA1 = {
  id: 'storm-surge-advisory-1' as HazardLevel,
  name: 'Storm Surge Advisory 1',
  layers: SSA1_ALL,
};

export const SSA2 = {
  id: 'storm-surge-advisory-2' as HazardLevel,
  name: 'Storm Surge Advisory 2',
  layers: SSA2_ALL,
};

export const SSA3 = {
  id: 'storm-surge-advisory-3' as HazardLevel,
  name: 'Storm Surge Advisory 3',
  layers: SSA3_ALL,
};

export const SSA4 = {
  id: 'storm-surge-advisory-4' as HazardLevel,
  name: 'Storm Surge Advisory 4',
  layers: SSA4_ALL,
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
