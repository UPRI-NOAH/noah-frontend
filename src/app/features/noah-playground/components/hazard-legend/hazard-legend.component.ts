import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  NoahColor,
  NoahColorLevel,
  NoahColorPalette,
  NoahColorSelection,
  NOAH_COLORS,
  NOAH_COLORS_ARRAY,
} from '@shared/mocks/noah-colors';

@Component({
  selector: 'noah-hazard-legend',
  templateUrl: './hazard-legend.component.html',
  styleUrls: ['./hazard-legend.component.scss'],
})
export class HazardLegendComponent implements OnInit {
  @Input() selectedColor: NoahColor = 'noah-red';
  @Input() highOnly = false;
  @Input() set customPalette(palette: NoahColorPalette | undefined) {
    this._customPalette = this.clonePalette(
      palette ?? NOAH_COLORS[this.customColor]
    );
  }

  get customPalette(): NoahColorPalette {
    return this._customPalette;
  }

  @Output() valueChange = new EventEmitter<NoahColorSelection>();

  customColor: NoahColor = 'noah-custom';
  noahColors = NOAH_COLORS_ARRAY.filter((color) => color !== this.customColor);
  private _customPalette = this.clonePalette(NOAH_COLORS[this.customColor]);

  get levels(): NoahColorLevel[] {
    if (this.highOnly) {
      return ['high'];
    }

    return ['high', 'medium', 'low'];
  }

  constructor() {}

  ngOnInit(): void {}

  selectColor(color: NoahColor) {
    this.selectedColor = color;
    this.valueChange.emit({
      color,
      customPalette:
        color === this.customColor ? this.customPalette : undefined,
    });
  }

  getColor(color: NoahColor, level: NoahColorLevel): string {
    if (color === this.customColor) {
      return this.customPalette[level];
    }

    return NOAH_COLORS[color][level];
  }

  updateCustomColor(event: Event) {
    const input = event.target as HTMLInputElement;
    const high = input.value;

    this._customPalette = {
      high,
      medium: this.mixWithWhite(high, 35),
      low: this.mixWithWhite(high, 65),
    };

    this.selectColor(this.customColor);
  }

  private clonePalette(palette: NoahColorPalette): NoahColorPalette {
    return { ...palette };
  }

  private mixWithWhite(hex: string, whitePercent: number): string {
    const cleanHex = hex.replace('#', '');
    const amount = whitePercent / 100;
    const red = parseInt(cleanHex.substring(0, 2), 16);
    const green = parseInt(cleanHex.substring(2, 4), 16);
    const blue = parseInt(cleanHex.substring(4, 6), 16);

    return `#${[red, green, blue]
      .map((channel) =>
        Math.round(channel + (255 - channel) * amount)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')}`;
  }
}
