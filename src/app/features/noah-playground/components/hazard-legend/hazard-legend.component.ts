import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  NoahColor,
  NoahColorLevel,
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
  @Output() valueChange = new EventEmitter<NoahColor>();

  customColor: NoahColor = 'noah-custom';
  customPalette = NOAH_COLORS[this.customColor];
  noahColors = NOAH_COLORS_ARRAY.filter((color) => color !== this.customColor);

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
    this.valueChange.emit(color);
  }

  getColor(color: NoahColor, level: NoahColorLevel): string {
    return NOAH_COLORS[color][level];
  }

  updateCustomColor(event: Event) {
    const input = event.target as HTMLInputElement;
    const high = input.value;

    this.customPalette.high = high;
    this.customPalette.medium = this.mixWithWhite(high, 35);
    this.customPalette.low = this.mixWithWhite(high, 65);

    this.selectColor(this.customColor);
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
