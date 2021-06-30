import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'noah-storm-surge-playground',
  templateUrl: './storm-surge-playground.component.html',
  styleUrls: ['./storm-surge-playground.component.scss'],
})
export class StormSurgePlaygroundComponent implements OnInit {
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
