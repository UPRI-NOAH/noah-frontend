import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { QcLoginService } from '@features/noah-playground/services/qc-login.service';

@Component({
  selector: 'noah-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  isLoginModal: boolean;

  constructor(private loginService: QcLoginService) {}

  ngOnInit(): void {
    this.isLoginModal = this.loginService.loginModal;
  }

  loginModal() {
    this.loginService.showLoginModal();
  }

  clearForm(form: FormGroup) {
    this.isLoginModal = false;
    form.reset();
  }
}
