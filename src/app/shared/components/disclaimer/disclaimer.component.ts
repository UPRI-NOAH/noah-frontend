import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'noah-disclaimer',
  templateUrl: './disclaimer.component.html',
  styleUrls: ['./disclaimer.component.scss'],
})
export class DisclaimerComponent implements OnInit {
  isLoginModal = true;
  constructor() {}

  ngOnInit(): void {}
  closeModal() {
    this.isLoginModal = false;
    console.log('asdasdas');
  }
}
