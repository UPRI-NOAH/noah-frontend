import { HazardLevel } from '@features/noah-playground/store/noah-playground.store';
import { HazardType } from '@features/personalized-risk-assessment/store/pra.store';
import { FLOOD_25_ALL } from './fh_25yr';

// FLOOD
export const FLOOD_5RRP = {
  id: 'flood-return-period-5' as HazardLevel,
  name: '5-Year Return Period',
  layers: [
    {
      id: 'flood-return-period-5' as HazardLevel,
      sourceLayer: 'Leyte_5year_Flood-atysck',
      url: 'mapbox://jadurani.1b0wrydb',
    },
  ],
};

export const FLOOD_25RRP = {
  id: 'flood-return-period-25' as HazardLevel,
  name: '25-Year Return Period',
  layers: FLOOD_25_ALL,
  // layers: [
  //   {
  //     id: 'flood-return-period-25' as HazardLevel,
  //     sourceLayer: 'Leyte_25year_Flood-cquuxm',
  //     url: 'mapbox://jadurani.60qgk1hq',
  //   },
  // ],
};

export const FLOOD_100RRP = {
  id: 'flood-return-period-100' as HazardLevel,
  name: '100-Year Return Period',
  layers: [
    {
      id: 'flood-return-period-100' as HazardLevel,
      sourceLayer: 'Leyte_Flood_100year-15dhkm',
      url: 'mapbox://jadurani.3tg2ae87',
    },
  ],
};

// LANDSLIDE
export const LANDSLIDE = {
  id: 'landslide-hazard' as HazardLevel,
  name: 'Landslides',
  layers: [
    {
      id: 'landslide-hazard' as HazardLevel,
      sourceLayer: 'Leyte_LandslideHazard-beq0xe',
      url: 'mapbox://jadurani.boxlw5qe',
    },
  ],
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
  layers: [
    {
      id: 'storm-surge-advisory-1' as HazardLevel,
      sourceLayer: 'Leyte_StormSurge_SSA1-98464r',
      url: 'mapbox://jadurani.7jztv1ca',
    },
  ],
};

export const SSA2 = {
  id: 'storm-surge-advisory-2' as HazardLevel,
  name: 'Storm Surge Advisory 2',
  layers: [
    {
      id: 'storm-surge-advisory-2' as HazardLevel,
      sourceLayer: 'Leyte_StormSurge_SSA2-9w17a5',
      url: 'mapbox://jadurani.851thu6i',
    },
  ],
};

export const SSA3 = {
  id: 'storm-surge-advisory-3' as HazardLevel,
  name: 'Storm Surge Advisory 3',
  layers: [
    {
      id: 'storm-surge-advisory-3' as HazardLevel,
      sourceLayer: 'Leyte_StormSurge_SSA3-b5acyy',
      url: 'mapbox://jadurani.79hq7qp9',
    },
  ],
};

export const SSA4 = {
  id: 'storm-surge-advisory-4' as HazardLevel,
  name: 'Storm Surge Advisory 4',
  layers: [
    {
      id: 'storm-surge-advisory-4' as HazardLevel,
      sourceLayer: 'Leyte_StormSurge_SSA4-8nbdij',
      url: 'mapbox://jadurani.2ojcvobn',
    },
  ],
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
