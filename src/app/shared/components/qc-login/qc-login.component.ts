import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QcLoginService } from '@features/noah-playground/services/qc-login.service';
import { Observable, Subject } from 'rxjs';
import { Location } from '@angular/common';
import { ModalServicesService } from '@features/noah-playground/services/modal-services.service';

@Component({
  selector: 'noah-qc-login',
  templateUrl: './qc-login.component.html',
  styleUrls: ['./qc-login.component.scss'],
})
export class QcLoginComponent implements OnInit {
  @Input() loginTerm: string;
  @Output() loginSuccess: EventEmitter<any> = new EventEmitter();
  @Output() selectPlace: EventEmitter<any> = new EventEmitter();
  insertForm: FormGroup;
  isOpen$ = new Subject<boolean>();
  qcLoginModal: boolean;
  currentRole: any;
  returnUrl: string;
  invalidLogin: boolean;
  ErrorMessage: string;
  Username: FormControl;
  Password: FormControl;
  disclaimerModal: boolean;
  destroy = new Subject<any>();
  alertError: boolean = false;
  loadingNoah: boolean = false;
  isOpen: boolean = false;

  constructor(
    private qcLoginService: QcLoginService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private _location: Location,
    private modalService: ModalServicesService
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

    //Pop up login directly in url
    const loggedIn = localStorage.getItem('loginStatus');
    if (loggedIn == '1') {
      this.router.navigateByUrl(this.returnUrl);
    }
  }
  openModal() {
    this.isOpen$.next(true);
    this.modalService.closeModal();
  }

  closeModals() {
    this.isOpen$.next(false);
  }

  onSubmit() {
    const userLogin = this.insertForm.value;
    this.loadingNoah = true;
    this.qcLoginService
      .loginUser(userLogin.Username, userLogin.Password)
      .subscribe(
        (response) => {
          const auth_token = (<any>response).auth_token;
          this.invalidLogin = false;
          console.log(this.returnUrl);
          this.router.navigateByUrl(this.returnUrl);
          this.qcLoginModal = false;
          this.loadingNoah = false;
          this.closeModals();
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
          this.loadingNoah = false;
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

  onLogout() {
    this.qcLoginService.logout();
  }

  ngOnDestroy() {
    this.destroy.next();
  }
}