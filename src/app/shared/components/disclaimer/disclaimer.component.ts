import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'noah-disclaimer',
  templateUrl: './disclaimer.component.html',
  styleUrls: ['./disclaimer.component.scss'],
})
export class DisclaimerComponent implements OnInit {
  disclaimerModal = true;
  constructor() {}

  ngOnInit(): void {}

  closeModal(): boolean {
    const discStatus = localStorage.getItem('disclaimerStatus');
    this.disclaimerModal = false;
    if (discStatus == '1') {
      this.disclaimerModal = false;
      localStorage.setItem('disclaimerStatus', '0');
      return true;
    } else {
      return false;
    }
  }
}
