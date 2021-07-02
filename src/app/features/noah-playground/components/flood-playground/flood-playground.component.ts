import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'noah-flood-playground',
  templateUrl: './flood-playground.component.html',
  styleUrls: ['./flood-playground.component.scss'],
})
export class FloodPlaygroundComponent implements OnInit {
  isOpenedList: boolean = true;

  constructor() {}

  ngOnInit(): void {}

  openMenu() {
    this.isOpenedList = true;
  }

  closeMenu() {
    this.isOpenedList = false;
  }

  getSliderValue(event) {
    console.log(event.target.value);
  }
}
