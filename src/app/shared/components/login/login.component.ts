import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QcLoginService } from '@features/noah-playground/services/qc-login.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Location } from '@angular/common';
@Component({
  selector: 'noah-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  @Input() loginTerm: string;
  @Output() loginSuccess: EventEmitter<any> = new EventEmitter();
  @Output() selectPlace: EventEmitter<any> = new EventEmitter();
  insertForm: FormGroup;
  isLoginModal: boolean;
  currentRole: any;
  returnUrl: string;
  invalidLogin: boolean;
  ErrorMessage: string;
  Username: FormControl;
  Password: FormControl;
  disclaimerModal: boolean;
  alertError: boolean = false;
  loadingNoah: boolean = false;
  constructor(
    private qcLoginService: QcLoginService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private pgService: NoahPlaygroundService,
    private _location: Location
  ) {}

  LoginStatus$: Observable<boolean>;
  UserName$: Observable<string>;
  ButtonShow$: Observable<boolean>;

  loginForm = new FormGroup({
    userNameValidation: new FormControl('', Validators.required),
    passwordValidation: new FormControl('', Validators.required),
  });

  ngOnInit(): void {
    // Initialize Form Controls
    this.Username = new FormControl('', [Validators.required]);
    this.Password = new FormControl('', [Validators.required]);

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Initialize FormGroup using FormBuilder
    this.insertForm = this.fb.group({
      Username: this.Username,
      Password: this.Password,
    });

    this.LoginStatus$ = this.qcLoginService.isLoggesIn;
    this.UserName$ = this.qcLoginService.currentUserName;
    this.alertError = false;
    this.loadingNoah = false;
  }

  onSubmit() {
    const userLogin = this.insertForm.value;
    this.onLoadingNoah();
    this.qcLoginService
      .loginUser(userLogin.Username, userLogin.Password)
      .subscribe(
        (response) => {
          const auth_token = (<any>response).auth_token;
          this.invalidLogin = false;
          console.log(this.returnUrl);
          this.router.navigateByUrl(this.returnUrl);
          this.isLoginModal = false;
          this.pgService.toggleQuezonCitySensorsGroupShown();
          this.router.navigateByUrl('/noah-playground');
          setTimeout(() => {
            //SESSION EXPIRATION
            localStorage.removeItem('token');
            alert('Your Session expired');
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.setItem('loginStatus', '0');
            this.router
              .navigateByUrl('/logout', { skipLocationChange: true })
              .then(() => {
                this.router.navigate([decodeURI(this._location.path())]);
                window.location.reload();
              });
          }, 86400000); //1 day
        },
        (error) => {
          this.invalidLogin = true;
          this.ErrorMessage = error.error.loginError;
          console.log(this.ErrorMessage);
          this.alertError = true;
          setTimeout(() => {
            this.alertError = false;
          }, 2000); //3secs
        }
      );
  }

  onLoadingNoah() {
    this.loadingNoah = true;
    setTimeout(() => {
      this.loadingNoah = false;
    }, 3000);
  }

  onLogout() {
    this.qcLoginService.logout();
  }

  loginModal() {
    this.qcLoginService.showLoginModal();
  }

  clearForm(form: FormGroup) {
    this.isLoginModal = false;
    form.reset();
  }
  closeModal() {
    this.isLoginModal = false;
  }
}
