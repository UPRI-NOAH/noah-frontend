import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'noah-landslide-playground',
  templateUrl: './landslide-playground.component.html',
  styleUrls: ['./landslide-playground.component.scss'],
})
export class LandslidePlaygroundComponent implements OnInit {
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
