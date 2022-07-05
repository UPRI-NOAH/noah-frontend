import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QcLoginService } from '@features/noah-playground/services/qc-login.service';
import { QC_DEFAULT_CENTER } from '@features/noah-playground/store/noah-playground.store';
import mapboxgl, { Map } from 'mapbox-gl';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'noah-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  @Input() loginTerm: string;
  @Output() loginSuccess: EventEmitter<any> = new EventEmitter();
  loginFormCrtl: FormGroup;
  map!: Map;
  isLoginModal: boolean;
  input;

  private _unsub = new Subject();

  constructor(
    private qaService: GoogleAnalyticsService,
    private pgService: NoahPlaygroundService,
    private loginService: QcLoginService,
    private router: Router
  ) {}

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
    // this.map = new mapboxgl.Map({

    // });
  }

  // async onLogin() {
  //   this.loginService.loginUser(this.input).subscribe(
  //     (response) => {
  //       console.log(response);
  //       alert('User ' + this.input.username + ' logged.');
  //       this.isLoginModal = false;
  //       // this.map.flyTo({
  //       //   center: qcCenter,
  //       //   zoom: 17,
  //       //   essential: true,
  //       // });
  //       const coords: { lat: number; lng: number } =
  //         await this.loginService.getQuezonCityLocation();
  //       this.pgService.setCurrentLocation(response.text);
  //       const [lng, lat] = response.qcCenter;
  //       this.pgService.setQcCenter({ lat, lng });
  //       this.router.navigate(['noah-playground']);
  //     },
  //     (error) => {
  //       console.log('error', error);
  //       alert('Please Enter Valid Details');
  //     }
  //   );
  // }

  async onLogin() {
    this.loginService.loginUser(this.input).subscribe((response) => {
      console.log(response);
      alert('User ' + this.input.username + ' logged.');
    });
    try {
      const coords: { lat: number; lng: number } =
        await this.loginService.getQuezonCityLocation();
      const qcPlace = {
        qcCenter: [coords.lng, coords.lat],
      };

      this.pgService.qcCenter$
        .pipe(distinctUntilChanged(), takeUntil(this._unsub))
        .subscribe((qcCenter) => {
          this.map.flyTo({
            center: qcCenter,
            zoom: 17,
            pitch: 50,
            essential: true,
          });
        });

      this.qaService.event('select_location', 'geolocation');
      // this.pgService.setCurrentLocation(qcPlace.qcCenter);
      const [lng, lat] = qcPlace.qcCenter;
      this.pgService.setQcCenter({ lat, lng }); //     } catch (error) {
    } catch (error) {
      console.log('error', error);
      alert('Please Enter Valid Details');
    } finally {
      this.isLoginModal = false;
      this.router.navigate(['noah-playground']);
    }
  }

  loginModal() {
    this.loginService.showLoginModal();
  }

  clearForm(form: FormGroup) {
    this.isLoginModal = false;
    form.reset();
  }
}
