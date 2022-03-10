import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';

@Component({
  selector: 'noah-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {
  searchTerm: string;
  isMenu: boolean = false;
  isList: number;
  isSearch: boolean = false;
  isLoginModal: boolean;
  loading = false;
  email: string;
  password: string;
  showAdminresult: boolean;
  qcAdmin: string;
  showAdmin: boolean;
  hideAdminButton: boolean;
  showAdminButton: boolean;
  kyhShow: boolean;

  constructor(
    private kyhService: KyhService,
    private router: Router,
    private title: Title,
    private pgService: NoahPlaygroundService
  ) {}

  loginForm = new FormGroup({
    emailValidation: new FormControl('', Validators.required),
    passwordValidation: new FormControl('', Validators.required),
  });

  get emailValidation() {
    return this.loginForm.get('emailValidation');
  }

  get passwordValidation() {
    return this.loginForm.get('passwordValidation');
  }
  ngOnInit(): void {
    this.isLoginModal = this.pgService.loginModal;
    this.showAdminresult = true;
    this.showAdmin = false;
    this.hideAdminButton = true;
    this.showAdminButton = false;
  }

  loginUser() {
    if (this.email == 'admin' && this.password == 'admin') {
      // this.router.navigate(['noah-playground']);
      console.log('Welcome', this.email);
      this.pgService.showAdmin();
      alert('You are Logged In');
      this.isLoginModal = false;
      this.showAdminresult = false;
      this.qcAdmin = this.pgService.qcadmin;
      this.showAdmin = true;
      this.hideAdminButton = false;
      this.showAdminButton = true;
      this.kyhService.kyhShowAdmin();
    } else {
      alert('Please Enter Valid Details');
    }
  }

  hideAdminn() {
    this.pgService.hideAdmin();
  }

  showAdminn() {
    this.pgService.showAdmin();
  }

  selectPlace(selectedPlace) {
    this.kyhService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.kyhService.setCenter({ lat, lng });
    this.kyhService.setCurrentCoords({ lat, lng });
    this.router.navigate(['know-your-hazards']);
  }

  loginModal() {
    this.pgService.showLoginModal();
  }

  clearForm(form: FormGroup) {
    this.isLoginModal = false;
    form.reset();
  }
}
