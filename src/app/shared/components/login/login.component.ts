import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { QcLoginService } from '@features/noah-playground/services/qc-login.service';

@Component({
  selector: 'noah-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  isLoginModal: boolean;
  input;

  constructor(private loginService: QcLoginService, private router: Router) {}

  loginForm = new FormGroup({
    userNameValidation: new FormControl('', Validators.required),
    passwordValidation: new FormControl('', Validators.required),
  });

  get userNameValidation() {
    return this.loginForm.get('userNameValidation');
  }

  get passwordValidation() {
    return this.loginForm.get('passwordValidation');
  }

  ngOnInit(): void {
    this.input = {
      username: '',
      password: '',
    };
    this.isLoginModal = this.loginService.loginModal;
  }

  onLogin() {
    this.loginService.loginUser(this.input).subscribe(
      (response) => {
        console.log(response);
        // alert('User ' + this.input.username + ' logged.');
        this.isLoginModal = false;
        this.router.navigate(['noah-playground']);
      },
      (error) => {
        console.log('error', error);
        alert('Please Enter Valid Details');
      }
    );
  }

  loginModal() {
    this.loginService.showLoginModal();
  }

  clearForm(form: FormGroup) {
    this.isLoginModal = false;
    form.reset();
  }
}
