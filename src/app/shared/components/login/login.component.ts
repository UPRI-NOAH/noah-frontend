import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QcLoginService } from '@features/noah-playground/services/qc-login.service';
import {
  NoahPlaygroundStore,
  QC_DEFAULT_CENTER,
} from '@features/noah-playground/store/noah-playground.store';
import mapboxgl, { Map } from 'mapbox-gl';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
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

  constructor(
    private qcLoginService: QcLoginService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
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
  }

  onSubmit() {
    const userLogin = this.insertForm.value;
    this.qcLoginService
      .loginUser(userLogin.Username, userLogin.Password)
      .subscribe(
        (response) => {
          const auth_token = (<any>response).auth_token;
          console.log(auth_token);
          console.log('User Logged In Successfully');
          this.invalidLogin = false;
          console.log(this.returnUrl);
          this.router.navigateByUrl(this.returnUrl);
          this.isLoginModal = false;
          this.router.navigateByUrl('/noah-playground');
        },
        (error) => {
          this.invalidLogin = true;
          this.ErrorMessage = error.error.loginError;
          console.log(this.ErrorMessage);
          alert('Invalid Credential');
        }
      );
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
