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
import { Observable, Subject } from 'rxjs';
import { Location } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { ModalService } from '@features/noah-playground/services/modal.service';
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
  logoutAlert: boolean = false;
  userName: string;
  isList;

  username: string = '';
  password: string = '';

  constructor(
    private qcLoginService: QcLoginService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private pgService: NoahPlaygroundService,
    private _location: Location,
    private modalService: ModalService
  ) {}

  LoginStatus$: Observable<boolean>;
  UserName$: Observable<string>;
  ButtonShow$: Observable<boolean>;

  ngOnInit(): void {
    this.userName = localStorage.getItem('name');
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    if (localStorage.getItem('loggedIn') === 'true') {
      this.router.navigate([this.returnUrl]);
    }

    if (window.location.href.indexOf('login') != -1) {
      this.isLoginModal = true;
    }

    if (window.location.href.indexOf('qc-login') != -1) {
      this.isLoginModal = false;
      this.qcLoginModal = true;
    }
  }

  onSubmit(): void {
    // Check if the user is already logged in before attempting to login again
    if (localStorage.getItem('loggedIn') === 'true') {
      console.log('Already logged in');
      return;
    }

    this.qcLoginService.loginUser(this.username, this.password).subscribe(
      (response) => {
        // Store the login state in sessionStorage
        this.invalidLogin = false;
        this.router.navigateByUrl(this.returnUrl);
        this.isLoginModal = false;
        this.loadingNoah = true;
        localStorage.setItem('loggedIn', 'true');

        if (this.username === 'qc_admin') {
          localStorage.setItem('name', 'qc admin');
          localStorage.setItem('loginStatus', '1');
        } else if (this.username === 'laguna_admin') {
          localStorage.setItem('name', 'Laguna');
          localStorage.setItem('loginStatus', '2');
        } else if (this.username === 'noah_dev') {
          localStorage.setItem('name', 'Devs');
          localStorage.setItem('loginStatus', 'devs');
        } else {
          console.log('Invalid Credentials');
        }
        this.pgService.toggleQuezonCityIOTGroupShown();
        this.pgService.toggleQuezonCityIOTGroupExpanded();
        this.router.navigateByUrl('/noah-playground');
      },
      (error) => {
        // handle login error
        console.error('Login error:', error);
        this.alertError = true;
        setTimeout(() => {
          this.alertError = false;
        }, 2000); //3secs
      }
    );
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('loggedIn') === 'true';
  }

  logoutModal() {
    this.modalService.openLogoutModal();
  }

  popUpLogin() {
    this.route.params.pipe(takeUntil(this.destroy)).subscribe((params) => {
      this.router.navigate(['login']);
      this.isLoginModal = true;
      this.qcLoginModal = false;
    });
  }

  loginModal() {
    this.qcLoginService.showLoginModal();
  }

  clearForm() {
    this.isLoginModal = false;
    this.qcLoginModal = false;
    this.router.navigate([''], {
      relativeTo: this.route,
    });
  }
  closeModal() {
    this.isLoginModal = false;
    this.qcLoginModal = false;
    this.router.navigate([''], {
      relativeTo: this.route,
    });
  }

  ngOnDestroy() {
    this.destroy.next();
  }

  logout(): void {
    this.qcLoginService.logout();
  }
}
