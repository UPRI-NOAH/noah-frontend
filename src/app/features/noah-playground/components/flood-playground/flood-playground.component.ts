import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'noah-flood-playground',
  templateUrl: './flood-playground.component.html',
  styleUrls: ['./flood-playground.component.scss'],
})
export class FloodPlaygroundComponent implements OnInit {
  isOpenedList;
  openMenu(source) {
    this.isOpenedList = source;
  }
  closeMenu() {
    this.isOpenedList = -1;
  }
  getSliderValue(event) {
    console.log(event.target.value);
  }

  constructor() {}

  ngOnInit(): void {}
}
