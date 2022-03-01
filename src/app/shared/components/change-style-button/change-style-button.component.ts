import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MapStyle } from '@features/know-your-hazards/store/kyh.store';

@Component({
  selector: 'noah-change-style-button',
  templateUrl: './change-style-button.component.html',
  styleUrls: ['./change-style-button.component.scss'],
})
export class ChangeStyleButtonComponent implements OnInit {
  @Input() selectedStyle: MapStyle;
  @Output() selectedStyleChange = new EventEmitter<MapStyle>();

  isOpenMenu = false;

  constructor() {}

  ngOnInit(): void {}

  changeStyle(style: MapStyle) {
    this.selectedStyleChange.emit(style);
    this.isOpenMenu = false;
  }
}
