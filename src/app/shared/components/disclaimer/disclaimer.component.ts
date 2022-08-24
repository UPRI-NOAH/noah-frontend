import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'noah-disclaimer',
  templateUrl: './disclaimer.component.html',
  styleUrls: ['./disclaimer.component.scss'],
})
export class DisclaimerComponent implements OnInit {
  disclaimerModal = true;
  contentFlow = false;
  hideSeemore = true;
  constructor() {}

  ngOnInit(): void {}

  showContent() {
    this.contentFlow = true;
    this.hideSeemore = false;
  }

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
