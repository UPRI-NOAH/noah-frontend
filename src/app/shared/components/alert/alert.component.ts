import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'noah-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  @Input() qcLoginModal: boolean;
  showAlert: boolean = true;
  @Output() open: EventEmitter<any> = new EventEmitter();
  @Output() close: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  onCloseClick() {
    this.showAlert = !this.showAlert;
    if (this.showAlert) {
      this.open.emit();
    } else {
      this.close.emit();
    }
  }

  loginToStudio() {}
}
