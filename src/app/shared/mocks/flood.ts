import { HazardLevel } from '@features/noah-playground/store/noah-playground.store';
import { Expression } from 'mapbox-gl';
import { NoahColor, NoahColorPalette, NOAH_COLORS } from './noah-colors';

// TO DO: Handle 3rd parameter properly
// We need a way to check if the hazard we're getting the colors for only has a certain number of
// hazard levels in it. Debris Flow only has 3 (highest level) in its dataset. If we add 1 and 2,
// The color we designate for it won't render
export const getHazardColor = (
  type: string,
  color: NoahColor,
  hazardLevel: HazardLevel,
  customPalette?: NoahColorPalette
): Expression => {
  const palette = customPalette ?? NOAH_COLORS[color];

  if (hazardLevel === 'unstable-slopes-maps') {
    return [
      'interpolate',
      ['linear'],
      ['get', 'GRIDCODE'],
      2,
      palette.high,
      3,
      palette.medium,
      4,
      palette.low,
    ] as Expression;
  }

  return [
    'interpolate',
    ['linear'],
    ['get', HAZARD_VARIABLES[type]],
    1,
    palette.low,
    2,
    palette.medium,
    3,
    palette.high,
  ] as Expression;
};

const HAZARD_VARIABLES = {
  flood: 'Var',
  landslide: 'LH',
  'storm-surge': 'HAZ',
};
