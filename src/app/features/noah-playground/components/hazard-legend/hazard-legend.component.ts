import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NoahColor, NOAH_COLORS_ARRAY } from '@shared/mocks/noah-colors';

@Component({
  selector: 'noah-hazard-legend',
  templateUrl: './hazard-legend.component.html',
  styleUrls: ['./hazard-legend.component.scss'],
})
export class HazardLegendComponent implements OnInit {
  @Input() selectedColor = 'noah-red';
  @Input() highOnly = false;
  @Output() valueChange = new EventEmitter();

  noahColors = NOAH_COLORS_ARRAY;

  get levels(): string[] {
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
}
