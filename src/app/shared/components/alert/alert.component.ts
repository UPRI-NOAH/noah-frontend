import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { QcLoginService } from '@features/noah-playground/services/qc-login.service';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'noah-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  @Input() qcLoginModal: boolean;
  showAlert: boolean = true;
  LoginStatus$: Observable<boolean>;
  destroy = new Subject<any>();
  @Output() open: EventEmitter<any> = new EventEmitter();
  @Output() close: EventEmitter<any> = new EventEmitter();

  constructor(
    private qcLoginService: QcLoginService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.LoginStatus$ = this.qcLoginService.isLoggesIn;
  }

  onCloseClick() {
    this.showAlert = !this.showAlert;
    if (this.showAlert) {
      this.open.emit();
    } else {
      this.close.emit();
    }
  }

  loginToStudio() {
    this.router.navigateByUrl(`/noah-qc-login}`);
  }
}
