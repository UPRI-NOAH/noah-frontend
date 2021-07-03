import { Component, OnInit } from '@angular/core';
import { NOAH_COLORS_ARRAY } from '@shared/mocks/noah-colors';

@Component({
  selector: 'noah-hazard-legend',
  templateUrl: './hazard-legend.component.html',
  styleUrls: ['./hazard-legend.component.scss'],
})
export class HazardLegendComponent implements OnInit {
  noahColors: string[] = NOAH_COLORS_ARRAY;
  levels: string[] = ['high', 'medium', 'low'];
  selectedColor = 'noah-red';

  constructor() {}

  ngOnInit(): void {}
}
