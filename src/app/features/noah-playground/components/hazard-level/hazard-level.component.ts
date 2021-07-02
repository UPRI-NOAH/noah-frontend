import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'noah-hazard-level',
  templateUrl: './hazard-level.component.html',
  styleUrls: ['./hazard-level.component.scss'],
})
export class HazardLevelComponent implements OnInit {
  @Input() id: string;
  @Input() name: string;

  constructor() {}

  ngOnInit(): void {}
}
