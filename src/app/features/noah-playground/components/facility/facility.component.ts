import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'noah-facility',
  templateUrl: './facility.component.html',
  styleUrls: ['./facility.component.scss'],
})
export class FacilityComponent implements OnInit {
  @Input() name: string;

  constructor() {}

  ngOnInit(): void {}
}
