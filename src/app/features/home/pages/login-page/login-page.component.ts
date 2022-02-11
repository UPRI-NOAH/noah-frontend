import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
@Component({
  selector: 'noah-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements OnInit {
  isLoginModal = this.kyhService.loginModal;
  searchTerm: string;
  constructor(
    private kyhService: KyhService,
    private router: Router,
    private title: Title
  ) {}

  ngOnInit(): void {}

  selectPlace(selectedPlace) {
    this.kyhService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.kyhService.setCenter({ lat, lng });
    this.kyhService.setCurrentCoords({ lat, lng });
    this.router.navigate(['know-your-hazards']);
  }
}
