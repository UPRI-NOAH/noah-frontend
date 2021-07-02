// FLOOD
export const FLOOD_5RRP = {
  id: 'flood-return-period-5',
  name: '5-Year Return Period',
};

export const FLOOD_25RRP = {
  id: 'flood-return-period-25',
  name: '25-Year Return Period',
};

export const FLOOD_100RRP = {
  id: 'flood-return-period-100',
  name: '100-Year Return Period',
};

// LANDSLIDE
export const LANDSLIDE = {
  id: 'landslide-hazard',
  name: 'Landslides',
};

export const ALLUVIAL_FAN = {
  id: 'alluvial-fan-hazard',
  name: 'Alluvial Fan',
};

export const UNSTABLE_SLOPES = {
  id: 'unstable-slopes-maps',
  name: 'Unstable Slopes',
};

// STORM SURGE
export const SSA1 = {
  id: 'storm-surge-advisory-1',
  name: 'Storm Surge Advisory 1',
};

export const SSA2 = {
  id: 'storm-surge-advisory-2',
  name: 'Storm Surge Advisory 2',
};

export const SSA3 = {
  id: 'storm-surge-advisory-3',
  name: 'Storm Surge Advisory 3',
};

export const SSA4 = {
  id: 'storm-surge-advisory-4',
  name: 'Storm Surge Advisory 4',
};

// COLLATED LEVELS
export const FLOOD_HAZARD_LEVELS = [FLOOD_5RRP, FLOOD_25RRP, FLOOD_100RRP];
export const LANDSLIDE_HAZARD_TYPES = [
  LANDSLIDE,
  ALLUVIAL_FAN,
  UNSTABLE_SLOPES,
];
export const STORM_SURGE_HAZARD_LEVELS = [SSA1, SSA2, SSA3, SSA4];

export const HAZARDS = [
  {
    name: 'Flood Hazard',
    type: 'flood',
    levels: FLOOD_HAZARD_LEVELS,
  },
  {
    name: 'Landslide Hazard',
    type: 'landslide',
    levels: LANDSLIDE_HAZARD_TYPES,
  },
  {
    name: 'Storm Surge Hazard',
    type: 'storm-surge',
    levels: STORM_SURGE_HAZARD_LEVELS,
  },
];
