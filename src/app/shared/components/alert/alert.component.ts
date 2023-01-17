import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'noah-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  alertMe: boolean = true;

  constructor() {}

  ngOnInit(): void {}

  loginToStudio() {}
}
