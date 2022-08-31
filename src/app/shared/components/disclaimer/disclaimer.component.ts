import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-disclaimer',
  templateUrl: './disclaimer.component.html',
  styleUrls: ['./disclaimer.component.scss'],
})
export class DisclaimerComponent implements OnInit {
  contentFlow = false;
  hideSeemore = true;
  constructor() {}
  disclaimer: boolean;

  ngOnInit(): void {
    const discStatus = localStorage.getItem('disclaimerStatus');
    if (discStatus == 'true') {
      this.disclaimer = true;
    }
    if (discStatus == 'false') {
      this.disclaimer = false;
    }
  }

  showContent() {
    this.contentFlow = true;
    this.hideSeemore = false;
  }

  closeModal(): boolean {
    const discStatus = localStorage.getItem('disclaimerStatus');
    this.disclaimer = false;
    if (discStatus == 'true') {
      this.disclaimer = false;
      localStorage.setItem('disclaimerStatus', 'false');
      return true;
    } else {
      return false;
    }
  }
}
