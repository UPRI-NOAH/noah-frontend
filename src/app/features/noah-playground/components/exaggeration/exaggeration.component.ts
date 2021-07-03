import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'noah-exaggeration',
  templateUrl: './exaggeration.component.html',
  styleUrls: ['./exaggeration.component.scss'],
})
export class ExaggerationComponent implements OnInit {
  isOpenedList: boolean = true;

  constructor() {}

  ngOnInit(): void {}

  openMenu() {
    this.isOpenedList = true;
  }

  closeMenu() {
    this.isOpenedList = false;
  }
}
